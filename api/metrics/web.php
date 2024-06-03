<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Telegram App Metrics</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
        }

        .container {
            margin-top: 20px;
        }

        .data-table {
            margin-top: 20px;
        }

        .table .warning {
            color: red;
        }

        .table .plan-deviation {
            color: blue;
        }

        .table .funnel {
            color: green;
        }

        @media (max-width: 768px) {
            .table td, .table th {
                display: block;
                width: 100%;
            }

            .table th {
                text-align: left;
            }
        }
    </style>
</head>
<body>
<div class="container">
    <!--    <h1 class="text-center">Telegram App Metrics</h1>-->
    <div class="d-flex justify-content-center">
        <div class="btn-group" role="group">
            <input type="radio" class="btn-check" name="date_filter" id="today" value="today" checked>
            <label class="btn btn-outline-primary" for="today">Сегодня</label>
            <input type="radio" class="btn-check" name="date_filter" id="yesterday" value="yesterday">
            <label class="btn btn-outline-primary" for="yesterday">Вчера</label>
        </div>
    </div>
    <div class="data-table">
        <table class="table table-striped table-bordered">
            <thead>
            <tr>
                <th>Название</th>
                <th>Значение</th>
            </tr>
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
        'total_sklad_gp': 'Готовая продукция склад с НДС',
        'cumulative_sklad_month': 'Производство',
        'cumulative_brak_month': 'Брак',
        'cumulative_manager_month': 'Отдел продаж',
        'prod': 'Производство',
        'sles': 'Слесарный участок',
        'otk': 'ОТК',
        'upk': 'Упаковка',
        'productivity_prod': 'Прод. оборудования',
        'productivity': 'Прод. производства',
        'get_sum_otgr_prod': 'Отгрузка М/О',
        'get_sum_otgr': 'Отгрузка',
    };

    function formatNumber(number) {
        return number.toLocaleString('ru-RU', { minimumFractionDigits: 2 });
    }

    function formatPercentage(value, maxCharacters) {
        const formattedValue = `${(value * 100).toFixed(2)}%`;
        return formattedValue.substring(0, maxCharacters);
    }

    function checkWarningAndFormat(value, label) {
        if (value <= 3400000) {
            return `<span class="warning">${formatNumber(value)}</span>`;
        } else {
            return formatNumber(value);
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
        const tbody = document.getElementById('metrics-data')
        tbody.innerHTML = ''
        if (!metrics || !metrics.metrics || index >= metrics.metrics.length) {
            const row = tbody.insertRow()
            const cell = row.insertCell()
            cell.colSpan = 2
            cell.textContent = 'Данные не найдены'
            return
        }

        const metric = metrics.metrics[index]
        for (const key in metric) {
            if (metric.hasOwnProperty(key)) {
                const row = tbody.insertRow()
                const nameCell = row.insertCell()
                const valueCell = row.insertCell()
                nameCell.textContent = humanNames[key] || key

                if (key === 'date') {
                    valueCell.textContent = moment(metric[key]).format('DD.MM.YYYY HH:mm:ss');
                } else if (['prod_price_mzp', 'prod_price', 'predoplata', 'total_price', 'total_sklad_gp', 'get_sum_otgr_prod', 'get_sum_otgr', 'productivity_prod', 'productivity'].includes(key)) {
                    valueCell.textContent = `${formatNumber(metric[key])} ₽`;
                    valueCell.classList.add('currency')
                } else if (['cumulative_sklad_month', 'cumulative_brak_month', 'cumulative_manager_month', 'prod', 'sles', 'otk', 'upk'].includes(key)) {
                    valueCell.textContent = `${formatPercentage(metric[key], 10)}`;
                    valueCell.classList.add('percent')
                } else {
                    valueCell.textContent = metric[key]
                }

                if (['prod_price_sles', 'prod_price_otk', 'prod_price_upk', 'prod_price_dorabotka', 'prod_price_dorabotka_sles', 'prod_price_sogl'].includes(key)) {
                    valueCell.classList.add('warning')
                }

                if (['cumulative_sklad_month', 'cumulative_brak_month', 'cumulative_manager_month'].includes(key)) {
                    valueCell.classList.add('plan-deviation')
                }

                if (['prod', 'sles', 'otk', 'upk'].includes(key)) {
                    valueCell.classList.add('funnel')
                }
            }
        }
    }

    const dateFilterRadios = document.querySelectorAll('input[name="date_filter"]')
    dateFilterRadios.forEach(radio => {
        radio.addEventListener('change', async () => {
            const dateFilter = radio.value
            const metrics = await fetchMetrics(dateFilter)
            if (metrics) {
                displayMetrics(metrics, dateFilter === 'today' ? 0 : 1)
            }
        })
    })

    window.onload = async () => {
        displayMetrics(await fetchMetrics('today'), 0)
    }
</script>
</body>
</html>