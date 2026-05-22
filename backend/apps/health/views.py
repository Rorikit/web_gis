from django.db import connections
from django.db.utils import OperationalError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        db_status = 'ok'
        try:
            with connections['default'].cursor() as cursor:
                cursor.execute('SELECT 1')
                cursor.fetchone()
        except OperationalError:
            db_status = 'error'

        payload = {
            'status': 'ok' if db_status == 'ok' else 'degraded',
            'services': {
                'database': db_status,
            },
        }
        code = status.HTTP_200_OK if db_status == 'ok' else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response(payload, status=code)
