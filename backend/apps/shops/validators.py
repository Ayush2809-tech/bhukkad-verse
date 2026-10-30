import os
from django.conf import settings
from rest_framework.exceptions import ValidationError
from PIL import Image

def validate_menu_card_file(file_obj):
    """
    Validates uploaded vendor menu card file for:
    - Presence & Non-emptiness
    - File size limit (configurable in settings)
    - File extension (PDF, JPG, JPEG, PNG)
    - Magic signature bytes
    - Image decoding integrity for images

    Returns:
        dict: {
            'file_type': 'PDF' | 'JPEG' | 'PNG',
            'file_size_bytes': int,
            'original_filename': str,
        }
    Raises:
        ValidationError: if validation fails with an explanatory message.
    """
    if not file_obj:
        raise ValidationError("No file was uploaded.")

    # 1. Non-empty check
    file_size = getattr(file_obj, 'size', 0)
    if file_size <= 0:
        raise ValidationError("The uploaded file is empty.")

    # 2. Maximum size check
    max_bytes = getattr(settings, 'MAX_MENU_CARD_SIZE_BYTES', 10 * 1024 * 1024)
    max_mb = getattr(settings, 'MAX_MENU_CARD_SIZE_MB', 10)
    if file_size > max_bytes:
        raise ValidationError(f"File size exceeds the maximum limit of {max_mb} MB.")

    # 3. File extension check
    filename = getattr(file_obj, 'name', '')
    ext = os.path.splitext(filename)[1].lower()
    allowed_extensions = getattr(settings, 'ALLOWED_MENU_CARD_EXTENSIONS', ('.pdf', '.jpg', '.jpeg', '.png'))
    if ext not in allowed_extensions:
        raise ValidationError(
            f"Unsupported file format '{ext}'. Supported formats: PDF (.pdf), JPEG (.jpg, .jpeg), and PNG (.png)."
        )

    # 4. Read header magic bytes
    try:
        header = file_obj.read(16)
        file_obj.seek(0)
    except Exception:
        raise ValidationError("Unable to read file headers. The file may be unreadable.")

    # 5. Magic Byte & Integrity Validation
    is_pdf = header.startswith(b'%PDF-')
    is_jpeg = header.startswith(b'\xff\xd8\xff')
    is_png = header.startswith(b'\x89PNG\r\n\x1a\n')

    if not (is_pdf or is_jpeg or is_png):
        raise ValidationError(
            "Invalid file format or corrupted signature. The file content does not match its extension."
        )

    # 6. Content-Type / Extension Consistency & Pillow verification
    if ext == '.pdf':
        if not is_pdf:
            raise ValidationError("File has .pdf extension but its binary signature is not a valid PDF document.")
        file_type = 'PDF'
    elif ext in ('.jpg', '.jpeg'):
        if not is_jpeg:
            raise ValidationError("File has JPEG extension but its binary signature is not a valid JPEG image.")
        try:
            img = Image.open(file_obj)
            img.verify()
            file_obj.seek(0)
        except Exception:
            raise ValidationError("The uploaded JPEG image is corrupted or invalid.")
        file_type = 'JPEG'
    elif ext == '.png':
        if not is_png:
            raise ValidationError("File has .png extension but its binary signature is not a valid PNG image.")
        try:
            img = Image.open(file_obj)
            img.verify()
            file_obj.seek(0)
        except Exception:
            raise ValidationError("The uploaded PNG image is corrupted or invalid.")
        file_type = 'PNG'
    else:
        raise ValidationError("Unsupported file extension.")

    return {
        'file_type': file_type,
        'file_size_bytes': file_size,
        'original_filename': filename,
    }
