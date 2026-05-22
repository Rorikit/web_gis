from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import UserRole

User = get_user_model()


class AuthApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='admin', password='admin')
        profile = self.user.profile
        profile.role = UserRole.ADMIN
        profile.full_name = 'Администратор системы'
        profile.save(update_fields=['role', 'full_name'])

    def test_me_returns_null_for_anonymous(self):
        response = self.client.get(reverse('auth-me'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.json())

    def test_login_returns_user_payload(self):
        response = self.client.post(
            reverse('auth-login'),
            {'ldapLogin': 'admin', 'password': 'admin'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertEqual(body['ldapLogin'], 'admin')
        self.assertEqual(body['role'], UserRole.ADMIN)
        self.assertEqual(body['fullName'], 'Администратор системы')

    def test_logout_is_idempotent(self):
        response = self.client.post(reverse('auth-logout'))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_logout_clears_session(self):
        self.client.post(
            reverse('auth-login'),
            {'ldapLogin': 'admin', 'password': 'admin'},
            format='json',
        )

        logout_response = self.client.post(reverse('auth-logout'))
        self.assertEqual(logout_response.status_code, status.HTTP_204_NO_CONTENT)

        me_response = self.client.get(reverse('auth-me'))
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertIsNone(me_response.json())
