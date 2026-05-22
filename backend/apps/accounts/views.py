from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import LoginSerializer, serialize_user


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ldap_login = serializer.validated_data['ldapLogin']
        password = serializer.validated_data['password']

        user = authenticate(request=request, username=ldap_login, password=password)
        if not user:
            return Response({'detail': 'Неверный логин или пароль'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'detail': 'Пользователь заблокирован'}, status=status.HTTP_403_FORBIDDEN)

        login(request, user)
        return Response(serialize_user(user), status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if not request.user.is_authenticated:
            return JsonResponse(None, safe=False, status=status.HTTP_200_OK)
        return Response(serialize_user(request.user), status=status.HTTP_200_OK)
