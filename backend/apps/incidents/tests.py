from datetime import date

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import District, UserRole
from apps.incidents.models import AreaState, ContractorType, Damage, DamageType, NetworkType, OrderKind

User = get_user_model()


class IncidentsApiTests(APITestCase):
    def setUp(self):
        self.central = District.objects.create(id='central', name='Центральный район')
        self.north = District.objects.create(id='north', name='Северный район')

        self.admin = User.objects.create_user(username='admin', password='admin', is_superuser=True, is_staff=True)
        self.admin.profile.role = UserRole.ADMIN
        self.admin.profile.full_name = 'Администратор'
        self.admin.profile.save()

        self.damage_user = User.objects.create_user(username='ivanov', password='ivanov')
        self.damage_user.profile.role = UserRole.DISTRICT_DAMAGE
        self.damage_user.profile.full_name = 'Иванов'
        self.damage_user.profile.district = self.central
        self.damage_user.profile.save()

        self.order_user = User.objects.create_user(username='sidorov', password='sidorov')
        self.order_user.profile.role = UserRole.DISTRICT_ORDER
        self.order_user.profile.full_name = 'Сидоров'
        self.order_user.profile.district = self.north
        self.order_user.profile.save()

        self.oopppr_user = User.objects.create_user(username='petrova', password='petrova')
        self.oopppr_user.profile.role = UserRole.OOPPPR
        self.oopppr_user.profile.full_name = 'Петрова'
        self.oopppr_user.profile.save()

        self.damage_central = Damage.objects.create(
            district=self.central,
            address='ул. Ленина, 12',
            network_type=NetworkType.OT,
            detected_at=date(2026, 5, 11),
            order_number='ОР-2026-0012',
            order_opened_at=date(2026, 5, 11),
            order_valid_until=date(2026, 6, 10),
            heat_source='ТЭЦ-3',
            damage_type=DamageType.CURRENT,
            disconnected_consumers=4,
            damage_description='Повреждение трубопровода',
            order_kind=OrderKind.CURRENT,
            green_zone_area=12,
            asphalt_area=8,
            improvement_main=True,
            improvement_inner_road=False,
            improvement_sidewalk=True,
            improvement_blind_area=False,
            curb_count=3,
            area_state=AreaState.IN_PROGRESS,
            contractor_type=ContractorType.CONTRACTOR,
            contractor_name='Подрядчик #1',
            contract_number='Д-44/26',
            planned_finish_date=date(2026, 5, 28),
            note='Контроль восстановления',
            archived=False,
        )

        self.damage_north = Damage.objects.create(
            district=self.north,
            address='пр. Мира, 78',
            network_type=NetworkType.GVS,
            detected_at=date(2026, 5, 15),
            fixed_at=date(2026, 5, 17),
            order_number='ОР-2026-0031',
            order_opened_at=date(2026, 5, 15),
            order_valid_until=date(2026, 6, 14),
            heat_source='Котельная Северная',
            damage_type=DamageType.HYDRAULIC,
            disconnected_consumers=0,
            damage_description='Повреждение после испытаний',
            order_kind=OrderKind.GUARANTEE,
            green_zone_area=0,
            asphalt_area=18,
            improvement_main=True,
            improvement_inner_road=True,
            improvement_sidewalk=False,
            improvement_blind_area=False,
            curb_count=0,
            area_state=AreaState.READY_TO_CLOSE,
            contractor_type=ContractorType.URTS,
            contractor_name='УРТС',
            contract_number='',
            planned_finish_date=date(2026, 5, 25),
            archived=False,
        )

    def test_damage_list_filtered_by_district(self):
        self.client.login(username='ivanov', password='ivanov')

        response = self.client.get('/damages', {'archived': 'false'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        body = response.json()
        self.assertEqual(len(body), 1)
        self.assertEqual(body[0]['id'], self.damage_central.id)

    def test_damage_update_forbidden_for_order_role(self):
        self.client.login(username='sidorov', password='sidorov')

        response = self.client.put(
            f'/damages/{self.damage_north.id}',
            {'note': 'new note'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_damage_create_forbidden_for_foreign_district(self):
        self.client.login(username='ivanov', password='ivanov')

        response = self.client.post(
            '/damages',
            {'districtId': self.north.id, 'address': 'пр. Победы, 1'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_damage_update_forbidden_to_move_into_foreign_district(self):
        self.client.login(username='ivanov', password='ivanov')

        response = self.client.put(
            f'/damages/{self.damage_central.id}',
            {'districtId': self.north.id},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_order_update_oopppr_only_oopppr_fields(self):
        self.client.login(username='petrova', password='petrova')

        response = self.client.put(
            f'/orders/{self.damage_central.id}',
            {
                'contractorName': 'ООО Ромашка',
                'contractNumber': 'K-100',
                'plannedFinishDate': '2026-06-01',
                'note': 'ok',
                'address': 'Адрес не должен обновиться',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.damage_central.refresh_from_db()
        self.assertEqual(self.damage_central.contractor_name, 'ООО Ромашка')
        self.assertEqual(self.damage_central.address, 'ул. Ленина, 12')

    def test_gis_save_point(self):
        self.client.login(username='ivanov', password='ivanov')

        response = self.client.post(
            f'/gis/damages/{self.damage_central.id}/point',
            {'latitude': 55.7558, 'longitude': 37.6173},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertIsNotNone(body['gisPoint'])
        self.assertEqual(body['gisPoint']['latitude'], 55.7558)

    def test_users_list_admin_only(self):
        self.client.login(username='ivanov', password='ivanov')
        denied = self.client.get('/users')
        self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)

        self.client.logout()
        self.client.login(username='admin', password='admin')
        allowed = self.client.get('/users')
        self.assertEqual(allowed.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(allowed.json()), 4)

    def test_users_create_admin_only(self):
        self.client.login(username='ivanov', password='ivanov')
        denied = self.client.post(
            '/users',
            {'ldapLogin': 'newuser', 'password': 'Str0ng!Pass123', 'role': UserRole.DISTRICT_DAMAGE},
            format='json',
        )
        self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)

    def test_users_create_success(self):
        self.client.login(username='admin', password='admin')
        response = self.client.post(
            '/users',
            {
                'ldapLogin': 'newuser',
                'password': 'Str0ng!Pass123',
                'fullName': 'Новый Пользователь',
                'role': UserRole.DISTRICT_ORDER,
                'districtId': self.north.id,
                'isActive': True,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        body = response.json()
        self.assertEqual(body['ldapLogin'], 'newuser')
        self.assertEqual(body['role'], UserRole.DISTRICT_ORDER)
        self.assertEqual(body['districtId'], self.north.id)

        created_user = User.objects.get(username='newuser')
        self.assertTrue(created_user.check_password('Str0ng!Pass123'))

    def test_users_create_duplicate_login(self):
        self.client.login(username='admin', password='admin')
        response = self.client.post(
            '/users',
            {'ldapLogin': 'ivanov', 'password': 'Str0ng!Pass123', 'role': UserRole.DISTRICT_DAMAGE},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_users_create_weak_password_rejected(self):
        self.client.login(username='admin', password='admin')
        response = self.client.post(
            '/users',
            {'ldapLogin': 'weakuser', 'password': '123', 'role': UserRole.DISTRICT_DAMAGE},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(username='weakuser').exists())

    def test_export_current_table_damages(self):
        self.client.login(username='admin', password='admin')
        response = self.client.post('/exports/current-table', {'entityType': 'damages', 'archived': False}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        self.assertTrue(len(response.content) > 0)

    def test_export_current_table_scoped_to_district(self):
        self.client.login(username='ivanov', password='ivanov')
        response = self.client.post('/exports/current-table', {'entityType': 'damages', 'archived': False}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_audit_history(self):
        self.client.login(username='ivanov', password='ivanov')
        self.client.put(f'/damages/{self.damage_central.id}', {'note': 'changed'}, format='json')

        response = self.client.get(f'/audit/damage/{self.damage_central.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.json()), 1)
