<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Telegram App Metrics</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <style>

        body {
            font-family: Arial, sans-serif;
        }

        .container {
            margin-top: 20px;
            padding-left: 1px;
            padding-right: 1px;
        }

        .data-table {
            margin-top: 20px;
        }

        /* Стили для экранов шириной менее 390px */
        @media (max-width: 370px) {
            .table {
                font-size: 12px; /* Уменьшаем размер шрифта */
            }

            .table td, .table th {
                display: inline-block; /* Для более точного контроля ширины */
                width: 40%; /* Задаем ширину ячейки */
                box-sizing: border-box;
                vertical-align: top;
                overflow: hidden; /* Обрезаем содержимое, выходящее за пределы ячейки */
                white-space: nowrap; /* Запрещаем перенос текста на новую строку */
                text-overflow: ellipsis; /* Добавляем многоточие в конце обрезанного текста */
            }

            .table td {
                margin-bottom: 10px; /* Пространство между ячейками */
            }

            .table th {
                display: none; /* Скрываем заголовки таблицы */
            }

            .table thead tr {
                position: absolute;
                top: -9999px;
                left: -9999px;
            }
        }

        /* Стили для экранов шириной менее 768px (для обычного Bootstrap-стиля) */
        @media (max-width: 768px) {
            .table th {
                text-align: left;
            }
            .table-cell-left {
                width: 60%;
                box-sizing: border-box;
                /* Позволяет содержимому переноситься на новую строку */
                word-wrap: break-word;
            }

            .table-cell-right {
                width: 40%;
                box-sizing: border-box;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }
        }
    </style>
</head>
<body data-bs-theme="dark">
<div class="container">
    <div class="d-flex justify-content-center">
        <div class="btn-group" role="group">
            <input type="radio" class="btn-check" name="date_filter" id="today" value="today" checked>
            <label class="btn btn-outline-primary" for="today">Сейчас</label>
            <input type="radio" class="btn-check" name="date_filter" id="yesterday" value="yesterday">
            <label class="btn btn-outline-primary" for="yesterday">Вчера</label>
        </div>
    </div>
    <div class="data-table">
        <table class="table table-striped table-bordered">
            <thead>
            </thead>
            <tbody id="metrics-data"></tbody>
        </table>
    </div>
</div>

<script>
    const humanNames = {
        'date': 'Дата',
        'prod_price_mzp': 'Незавершённое по М/О',
        'prod_price_sles': 'Слесарка',
        'prod_price_otk': 'ОТК',
        'prod_price_upk': 'Упаковка',
        'prod_price_dorabotka': 'Доработка ЧПУ',
        'prod_price_dorabotka_sles': 'Доработка слес.',
        'prod_price_sogl': 'Согласование',
        'prod_price': 'Итого внутр. производства',
        'predoplata': 'Ожидаемая предоплата',
        'total_price': 'Итого вн. производства с НДС',
        'total_sklad_gp': '✅ Готовая продукция склад с НДС',
        'cumulative_sklad_month': '📈 Производство',
        'cumulative_brak_month': '📈 Брак',
        'cumulative_manager_month': '📈 Отдел продаж',
        'prod': '🔽 Производство',
        'sles': '🔽 Слесарный участок',
        'otk': '🔽 ОТК',
        'upk': '🔽 Упаковка',
        'productivity_prod': '⚙️ Продуктивность оборудования',
        'productivity': '⚙️ Продуктивность производства',
        'get_sum_otgr_prod': '📦 Отгрузка М/О',
        'get_sum_otgr': '📦 Отгрузка',
    }

    function formatNumber(number) {
        return Math.round(number).toLocaleString('ru-RU');
    }

    function formatPercentage(value, maxCharacters) {
        const formattedValue = `${(value).toFixed(0)}%`
        return formattedValue.substring(0, maxCharacters)
    }

    function checkWarningAndFormat(value, label) {
        if (value <= 3400000) {
            return `<span class='warning'>${formatNumber(value)}</span>`
        } else {
            return formatNumber(value)
        }
    }

    async function fetchMetrics(dateFilter) {
        try {
            const response = await fetch(`get.php?key=SecretKeyPFForum23&dateFilter=${dateFilter}`)
            const data = await response.json()
            return data
        } catch (error) {
            console.error('Ошибка получения данных:', error)
            return null
        }
    }

    function displayMetrics(metrics, index) {
        const tbody = document.getElementById('metrics-data');
        tbody.innerHTML = '';
        if (!metrics || !metrics.metrics || index >= metrics.metrics.length) {
            const row = tbody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 2;
            cell.textContent = 'Данные не найдены';
            return;
        }

        const metric = metrics.metrics[index];
        for (const key in metric) {
            if (metric.hasOwnProperty(key)) {
                const row = tbody.insertRow();
                const nameCell = row.insertCell();
                const valueCell = row.insertCell();
                nameCell.textContent = humanNames[key] || key;
                nameCell.classList.add('table-cell-left'); // Добавляем класс левой ячейке
                valueCell.classList.add('table-cell-right');

                if (key === 'date') {
                    valueCell.textContent = moment(metric[key]).format('DD.MM.YYYY')
                } else if (['prod_price_mzp', 'prod_price', 'predoplata', 'total_price', 'total_sklad_gp', 'get_sum_otgr_prod', 'get_sum_otgr', 'prod_price_sles', 'prod_price_otk', 'prod_price_upk', 'prod_price_sogl', 'prod_price', 'prod_price_dorabotka', 'prod_price_dorabotka_sles'].includes(key)) {
                    valueCell.textContent = `${formatNumber(metric[key])} ₽`
                    valueCell.classList.add('currency')
                } else if (['productivity_prod', 'productivity'].includes(key)) {
                    valueCell.textContent = `${formatNumber(metric[key])} ₽ / час`
                    valueCell.classList.add('currency')

                } else if (['cumulative_sklad_month', 'cumulative_brak_month', 'cumulative_manager_month', 'prod', 'sles', 'otk', 'upk'].includes(key)) {
                    valueCell.textContent = `${formatPercentage(metric[key], 10)}`
                    valueCell.classList.add('percent')
                } else {
                    valueCell.textContent = metric[key]
                }

                if (['prod_price_sles', 'prod_price_otk', 'prod_price_upk', 'prod_price_dorabotka', 'prod_price_dorabotka_sles', 'prod_price_sogl'].includes(key)) {
                    valueCell.classList.add('table-danger')
                }

                if (['cumulative_sklad_month', 'cumulative_brak_month', 'cumulative_manager_month'].includes(key)) {
                    valueCell.classList.add('table-info')
                }

                if (['prod', 'sles', 'otk', 'upk'].includes(key)) {
                    valueCell.classList.add('table-primary')
                }
            }
        }
    }

    const dateFilterRadios = document.querySelectorAll('input[name="date_filter"]')
    dateFilterRadios.forEach(radio => {
        radio.addEventListener('change', async () => {
            const dateFilter = radio.value
            const metrics = await fetchMetrics(dateFilter)

            if (metrics && metrics.metrics) {
                const index = dateFilter === 'today' ? 1 : 0 // Определение индекса для данных "today"
                displayMetrics(metrics, index)
            } else {
                // Обработка случая, когда данные не получены
                const tbody = document.getElementById('metrics-data')
                tbody.innerHTML = ''
                const row = tbody.insertRow()
                const cell = row.insertCell()
                cell.colSpan = 2
                cell.textContent = 'Данные не найдены'
            }
        })
    })

    window.onload = async () => {
        const metrics = await fetchMetrics('today') // Получаем данные за сегодня
        if (metrics && metrics.metrics) {
            displayMetrics(metrics, 1) // Отображаем данные за сегодня
        }
    }
</script>
</body>
</html>