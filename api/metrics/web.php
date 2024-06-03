<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>Telegram App Metrics</title>
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
                valueCell.textContent = metric[key]
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