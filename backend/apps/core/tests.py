from django.test import TestCase
from django.urls import reverse
from rest_framework import status

class HealthCheckTests(TestCase):
    def test_health_check_endpoint_returns_200(self):
        """
        Verify that GET /api/health/ returns HTTP 200 OK with healthy status and brand metadata.
        """
        url = reverse('health-check')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertEqual(data.get('status'), 'healthy')
        self.assertEqual(data.get('brand'), 'BHUKKAD VERSE')
        self.assertEqual(data.get('tagline'), 'YOUR CRAVINGS. YOUR UNIVERSE.')
        self.assertTrue(data.get('database', {}).get('connected'))
