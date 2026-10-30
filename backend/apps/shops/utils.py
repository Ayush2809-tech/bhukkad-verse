import math
from datetime import datetime, time, timedelta
import zoneinfo
from django.utils import timezone
from django.conf import settings

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes the authoritative great-circle distance between two geographic coordinates
    on Earth using the spherical Haversine formula.

    Returns:
        Distance in kilometers (rounded to 2 decimal places).
    """
    R = 6371.0088

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    distance = R * c
    return round(distance, 2)


def format_time_12h(t: time) -> str:
    """
    Formats a datetime.time object into human-readable 12-hour format (e.g., '10:00 AM', '11:30 PM').
    """
    if not t:
        return ""
    hour = t.hour % 12 or 12
    minute = f"{t.minute:02d}"
    period = "AM" if t.hour < 12 else "PM"
    return f"{hour}:{minute} {period}"


def get_shop_live_status(shop, timestamp=None) -> dict:
    """
    Authoritative backend engine to determine the real-time operational status of a shop.

    Considers:
    - Platform approval status (APPROVED, PENDING, REJECTED, SUSPENDED) and is_active flag.
    - Vendor-controlled temporary order pause state (is_accepting_orders, order_pause_reason).
    - Shop timezone-aware local datetime (defaults to shop.timezone or 'Asia/Kolkata').
    - Weekly operating hours schedule (Monday=0 through Sunday=6).
    - Overnight schedule handling (e.g., open Monday 18:00 through Tuesday 02:00).
    - Explicitly closed weekdays.
    - Next opening time prediction when currently closed.

    Returns:
        dict with:
            is_open (bool): Whether currently within scheduled operating hours.
            is_accepting_orders (bool): Whether orders can currently be accepted.
            status_code (str): 'OPEN', 'CLOSED', 'PAUSED', 'SUSPENDED', 'UNAPPROVED', 'INACTIVE'.
            status_display (str): Customer-friendly status label.
            next_opening_time (str|None): e.g. '10:00 AM' if closed.
            next_opening_day (str|None): e.g. 'Today', 'Tomorrow', 'Monday'.
            pause_reason (str): Reason if orders are paused by vendor.
    """
    # 1. Resolve Shop Timezone
    tz_str = getattr(shop, 'timezone', None) or 'Asia/Kolkata'
    try:
        shop_tz = zoneinfo.ZoneInfo(tz_str)
    except Exception:
        shop_tz = zoneinfo.ZoneInfo('Asia/Kolkata')

    # 2. Resolve target datetime
    if timestamp is None:
        local_dt = timezone.now().astimezone(shop_tz)
    else:
        if timezone.is_naive(timestamp):
            local_dt = timezone.make_aware(timestamp, shop_tz)
        else:
            local_dt = timestamp.astimezone(shop_tz)

    current_weekday = local_dt.weekday()  # 0=Monday, ..., 6=Sunday
    current_time = local_dt.time()
    prev_weekday = (current_weekday - 1) % 7

    # 3. Check moderation and platform activity
    from .models import Shop
    if not shop.is_active:
        return {
            "is_open": False,
            "is_accepting_orders": False,
            "is_paused": False,
            "status_code": "INACTIVE",
            "status_display": "Temporarily Unavailable",
            "status_label": "Temporarily Unavailable",
            "next_opening_time": None,
            "next_opening_day": None,
            "next_opening_text": None,
            "pause_reason": "",
        }

    if shop.status != Shop.Status.APPROVED:
        if shop.status == Shop.Status.SUSPENDED:
            display = "Temporarily Unavailable"
            code = "SUSPENDED"
        elif shop.status == Shop.Status.PENDING:
            display = "Under Review"
            code = "PENDING"
        elif shop.status == Shop.Status.REJECTED:
            display = "Application Rejected"
            code = "REJECTED"
        else:
            display = "Temporarily Unavailable"
            code = "UNAPPROVED"
        return {
            "is_open": False,
            "is_accepting_orders": False,
            "is_paused": False,
            "status_code": code,
            "status_display": display,
            "status_label": display,
            "next_opening_time": None,
            "next_opening_day": None,
            "next_opening_text": None,
            "pause_reason": "",
        }

    # 4. Fetch / Map Operating Hours
    # Uses prefetch cache if available to prevent N+1 queries
    all_hours = list(shop.operating_hours.all())
    hours_map = {oh.weekday: oh for oh in all_hours}

    # Fallback to legacy shop.opening_time / closing_time if no operating hours populated
    has_custom_schedule = len(hours_map) > 0
    today_hour = hours_map.get(current_weekday)
    prev_hour = hours_map.get(prev_weekday)

    # 5. Evaluate if kitchen is within operating hours (including overnight)
    is_currently_open = False

    # A. Check yesterday's overnight schedule spilling into today
    if prev_hour and not prev_hour.is_closed:
        if prev_hour.is_overnight and prev_hour.closing_time:
            # e.g., yesterday opened 18:00, closes today 02:00.
            # If current_time < 02:00:00 -> OPEN
            if current_time < prev_hour.closing_time:
                is_currently_open = True
    elif not has_custom_schedule and shop.opening_time and shop.closing_time:
        if shop.closing_time < shop.opening_time:
            if current_time < shop.closing_time:
                is_currently_open = True

    # B. Check today's schedule if not already established open
    if not is_currently_open:
        if today_hour and not today_hour.is_closed:
            if today_hour.opening_time and today_hour.closing_time:
                if not today_hour.is_overnight:
                    # Regular schedule (e.g. 10:00 to 23:00)
                    # Boundary: at exact opening_time it is OPEN, at closing_time it is CLOSED
                    if today_hour.opening_time <= current_time < today_hour.closing_time:
                        is_currently_open = True
                else:
                    # Overnight schedule starting today (e.g. 18:00 to 02:00)
                    if current_time >= today_hour.opening_time:
                        is_currently_open = True
        elif not has_custom_schedule and shop.opening_time and shop.closing_time:
            if shop.opening_time < shop.closing_time:
                if shop.opening_time <= current_time < shop.closing_time:
                    is_currently_open = True
            elif shop.closing_time < shop.opening_time:
                if current_time >= shop.opening_time:
                    is_currently_open = True

    # 6. Check Vendor Temporary Order Pause
    is_paused = not shop.is_accepting_orders
    pause_reason = shop.order_pause_reason if is_paused else ""

    if is_paused:
        # Vendor explicitly paused order acceptance
        return {
            "is_open": is_currently_open,
            "is_accepting_orders": False,
            "is_paused": True,
            "status_code": "PAUSED",
            "status_display": "Kitchen Paused",
            "status_label": "Kitchen Paused",
            "next_opening_time": None,
            "next_opening_day": None,
            "next_opening_text": None,
            "pause_reason": pause_reason or "Kitchen has temporarily paused accepting new orders.",
        }

    # 7. If currently Open and not paused
    if is_currently_open:
        return {
            "is_open": True,
            "is_accepting_orders": True,
            "is_paused": False,
            "status_code": "OPEN",
            "status_display": "Open Now",
            "status_label": "Open Now",
            "next_opening_time": None,
            "next_opening_day": None,
            "next_opening_text": None,
            "pause_reason": "",
        }

    # 8. Kitchen is currently Closed -> compute truthful next opening time
    # Check if opening later today
    next_time_str = None
    next_day_str = None
    weekday_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    if today_hour and not today_hour.is_closed and today_hour.opening_time:
        if current_time < today_hour.opening_time:
            next_time_str = format_time_12h(today_hour.opening_time)
            next_day_str = "Today"
            next_text = f"Today at {next_time_str}"
            return {
                "is_open": False,
                "is_accepting_orders": False,
                "is_paused": False,
                "status_code": "CLOSED",
                "status_display": f"Closed · Opens at {next_time_str}",
                "status_label": f"Closed · Opens at {next_time_str}",
                "next_opening_time": next_time_str,
                "next_opening_day": next_day_str,
                "next_opening_text": next_text,
                "pause_reason": "",
            }
    elif not has_custom_schedule and shop.opening_time and current_time < shop.opening_time:
        next_time_str = format_time_12h(shop.opening_time)
        next_text = f"Today at {next_time_str}"
        return {
            "is_open": False,
            "is_accepting_orders": False,
            "is_paused": False,
            "status_code": "CLOSED",
            "status_display": f"Closed · Opens at {next_time_str}",
            "status_label": f"Closed · Opens at {next_time_str}",
            "next_opening_time": next_time_str,
            "next_opening_day": "Today",
            "next_opening_text": next_text,
            "pause_reason": "",
        }

    # Search upcoming days in the next 6 days
    for days_ahead in range(1, 7):
        target_weekday = (current_weekday + days_ahead) % 7
        target_hour = hours_map.get(target_weekday)

        if target_hour and not target_hour.is_closed and target_hour.opening_time:
            next_time_str = format_time_12h(target_hour.opening_time)
            day_label = "Tomorrow" if days_ahead == 1 else weekday_names[target_weekday]
            target_weekday_name = weekday_names[target_weekday]
            next_text = f"{target_weekday_name} at {next_time_str}"
            return {
                "is_open": False,
                "is_accepting_orders": False,
                "is_paused": False,
                "status_code": "CLOSED",
                "status_display": f"Closed · Opens {day_label} at {next_time_str}",
                "status_label": f"Closed · Opens {day_label} at {next_time_str}",
                "next_opening_time": next_time_str,
                "next_opening_day": day_label,
                "next_opening_text": next_text,
                "pause_reason": "",
            }
        elif not has_custom_schedule and shop.opening_time:
            next_time_str = format_time_12h(shop.opening_time)
            day_label = "Tomorrow" if days_ahead == 1 else weekday_names[target_weekday]
            target_weekday_name = weekday_names[target_weekday]
            next_text = f"{target_weekday_name} at {next_time_str}"
            return {
                "is_open": False,
                "is_accepting_orders": False,
                "is_paused": False,
                "status_code": "CLOSED",
                "status_display": f"Closed · Opens {day_label} at {next_time_str}",
                "status_label": f"Closed · Opens {day_label} at {next_time_str}",
                "next_opening_time": next_time_str,
                "next_opening_day": day_label,
                "next_opening_text": next_text,
                "pause_reason": "",
            }

    # If no upcoming open day found
    return {
        "is_open": False,
        "is_accepting_orders": False,
        "is_paused": False,
        "status_code": "CLOSED",
        "status_display": "Closed Today",
        "status_label": "Closed Today",
        "next_opening_time": None,
        "next_opening_day": None,
        "next_opening_text": None,
        "pause_reason": "",
    }


def is_shop_accepting_orders(shop, timestamp=None) -> bool:
    """
    Authoritative boolean helper returning True if the kitchen is actively eligible
    to accept customer orders at the specified timestamp.
    """
    status_info = get_shop_live_status(shop, timestamp=timestamp)
    return status_info["is_accepting_orders"]
