import io

from docx import Document
from openpyxl import Workbook
from openpyxl.worksheet.worksheet import Worksheet

from .models import Damage


def _add_row(table, label: str, value) -> None:
    row = table.add_row()
    row.cells[0].text = label
    row.cells[1].text = '-' if value in (None, '') else str(value)


def build_damage_card_document(damage: Damage, additional_info: str = '') -> bytes:
    document = Document()
    document.add_heading(f'Карта повреждения {damage.id}', level=1)
    if damage.address:
        document.add_paragraph(damage.address)

    table = document.add_table(rows=0, cols=2)
    table.style = 'Table Grid'

    district_name = damage.district.name if damage.district_id else '-'

    _add_row(table, 'Район', district_name)
    _add_row(table, 'ОТ/ГВС', damage.network_type)
    _add_row(table, 'Тип повреждения', damage.damage_type)
    _add_row(table, 'Обнаружено', damage.detected_at)
    _add_row(table, 'Устранено', damage.fixed_at)
    _add_row(table, 'Источник тепла', damage.heat_source)
    _add_row(table, 'Описание повреждения', damage.damage_description)
    _add_row(table, 'Отключено потребителей', damage.disconnected_consumers)
    _add_row(table, '№ ордера', damage.order_number)
    _add_row(table, 'Вид ордера', damage.order_kind)
    _add_row(table, 'Ордер открыт', damage.order_opened_at)
    _add_row(table, 'Ордер действует до', damage.order_valid_until)
    _add_row(table, 'Ордер закрыт', damage.order_closed_at)
    _add_row(table, 'Состояние площадки', damage.area_state)
    _add_row(table, 'Зелёная зона, м²', damage.green_zone_area)
    _add_row(table, 'Асфальт, м²', damage.asphalt_area)
    _add_row(table, 'Бортовой камень, шт.', damage.curb_count)
    _add_row(table, 'Восстановление проезжей части', 'Да' if damage.improvement_main else 'Нет')
    _add_row(table, 'Восстановление тротуара', 'Да' if damage.improvement_sidewalk else 'Нет')
    _add_row(table, 'Тип исполнителя', damage.contractor_type)
    _add_row(table, '№ договора', damage.contract_number)
    _add_row(table, 'Плановый срок завершения', damage.planned_finish_date)

    point = getattr(damage, 'gis_point', None)
    if point is not None:
        _add_row(table, 'GIS-координаты', f'{point.latitude}, {point.longitude}')
        _add_row(table, 'GIS-адрес', damage.address)
    else:
        _add_row(table, 'GIS-точка', 'не указана')

    _add_row(table, 'Примечание', damage.note)

    if additional_info:
        document.add_heading('Дополнительные сведения', level=2)
        document.add_paragraph(additional_info)

    buffer = io.BytesIO()
    document.save(buffer)
    return buffer.getvalue()


def _write_header(sheet: Worksheet, columns: list[str]) -> None:
    sheet.append(columns)
    for cell in sheet[1]:
        cell.font = cell.font.copy(bold=True)


def build_reference_workbook(report_date: str) -> bytes:
    workbook = Workbook()

    damages_sheet = workbook.active
    damages_sheet.title = 'Повреждения'
    damages_sheet.append([f'Справка на {report_date}'])
    _write_header(damages_sheet, ['№', 'Район', 'Адрес', 'ОТ/ГВС', 'Тип повреждения', 'Обнаружено', 'Устранено', '№ ордера'])
    for item in Damage.objects.filter(archived=False).select_related('district').order_by('id'):
        damages_sheet.append([
            item.id,
            item.district.name if item.district_id else '-',
            item.address,
            item.network_type,
            item.damage_type,
            str(item.detected_at) if item.detected_at else '',
            str(item.fixed_at) if item.fixed_at else '',
            item.order_number,
        ])

    orders_sheet = workbook.create_sheet('Ордера')
    orders_sheet.append([f'Справка на {report_date}'])
    _write_header(orders_sheet, ['№', 'Район', '№ ордера', 'Адрес', 'Вид', 'Открыт', 'Действует до', 'Закрыт', 'Состояние', 'Исполнитель'])
    for item in Damage.objects.filter(archived=False).select_related('district').order_by('id'):
        orders_sheet.append([
            item.id,
            item.district.name if item.district_id else '-',
            item.order_number,
            item.address,
            item.order_kind,
            str(item.order_opened_at) if item.order_opened_at else '',
            str(item.order_valid_until) if item.order_valid_until else '',
            str(item.order_closed_at) if item.order_closed_at else '',
            item.area_state,
            item.contractor_name or item.contractor_type,
        ])

    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()
