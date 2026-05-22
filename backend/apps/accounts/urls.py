from django.urls import path

from .views import LoginView, LogoutView, MeView

urlpatterns = [
    path('auth/ldap/login', LoginView.as_view(), name='auth-login'),
    path('auth/logout', LogoutView.as_view(), name='auth-logout'),
    path('auth/me', MeView.as_view(), name='auth-me'),
]
