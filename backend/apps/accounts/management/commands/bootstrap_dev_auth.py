from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.accounts.models import District, UserRole

User = get_user_model()


class Command(BaseCommand):
    help = 'Создает тестовые районы и пользователей для dev-авторизации.'

    def handle(self, *args, **options):
        districts = [
            ('sovetsky', 'Советский район'),
            ('moskovsky', 'Московский район'),
            ('oktyabrsky', 'Октябрьский район'),
            ('zheleznodorozhny', 'Железнодорожный район'),
            ('solotcha', 'Солотча'),
        ]

        for district_id, district_name in districts:
            District.objects.update_or_create(id=district_id, defaults={'name': district_name})

        sovetsky = District.objects.get(id='sovetsky')
        moskovsky = District.objects.get(id='moskovsky')

        self._upsert_user(
            username='admin',
            password='admin',
            is_superuser=True,
            is_staff=True,
            full_name='Администратор системы',
            role=UserRole.ADMIN,
            district=None,
        )
        self._upsert_user(
            username='ivanov',
            password='ivanov',
            is_superuser=False,
            is_staff=False,
            full_name='Иванов Сергей Петрович',
            role=UserRole.DISTRICT_DAMAGE,
            district=sovetsky,
        )
        self._upsert_user(
            username='petrova',
            password='petrova',
            is_superuser=False,
            is_staff=False,
            full_name='Петрова Анна Игоревна',
            role=UserRole.OOPPPR,
            district=None,
        )
        self._upsert_user(
            username='sidorov',
            password='sidorov',
            is_superuser=False,
            is_staff=False,
            full_name='Сидоров Алексей Николаевич',
            role=UserRole.DISTRICT_ORDER,
            district=moskovsky,
        )
        self._upsert_user(
            username='fullaccess',
            password='fullaccess',
            is_superuser=False,
            is_staff=False,
            full_name='Кузнецова Ольга Владимировна',
            role=UserRole.FULL_ACCESS,
            district=None,
        )

        self.stdout.write(self.style.SUCCESS('Dev-данные авторизации созданы/обновлены.'))

    def _upsert_user(
        self,
        *,
        username: str,
        password: str,
        is_superuser: bool,
        is_staff: bool,
        full_name: str,
        role: str,
        district,
    ) -> None:
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'is_superuser': is_superuser,
                'is_staff': is_staff,
                'is_active': True,
            },
        )

        if created:
            user.set_password(password)
            user.save(update_fields=['password'])

        user.is_superuser = is_superuser
        user.is_staff = is_staff
        user.is_active = True
        user.save(update_fields=['is_superuser', 'is_staff', 'is_active'])

        profile = user.profile
        profile.full_name = full_name
        profile.role = role
        profile.district = district
        profile.save(update_fields=['full_name', 'role', 'district'])
