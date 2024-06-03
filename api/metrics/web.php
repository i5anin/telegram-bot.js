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

        .data-table dl {
            margin-bottom: 1rem;
        }

        /* Добавлены стили для вертикальной таблицы на мобильных устройствах */
        @media (max-width: 768px) {
            .data-table dl dt {
                margin-bottom: 0.5rem;
            }
        }
    </style>
</head>

<body>
    <div class="container">
        <h1 class="text-center">Telegram App Metrics</h1>

        <div class="d-flex justify-content-center">
            <div class="btn-group" role="group">
                <input type="radio" class="btn-check" name="date_filter" id="today" value="today" checked>
                <label class="btn btn-outline-primary" for="today">Сегодня</label>
                <input type="radio" class="btn-check" name="date_filter" id="yesterday" value="yesterday">
                <label class="btn btn-outline-primary" for="yesterday">Вчера</label>
            </div>
        </div>

        <div class="data-table" id="metrics-data">
        </div>
    </div>

    <script>
        // Функция для загрузки данных с сервера
        async function fetchMetrics(dateFilter) {
            try {
                const response = await fetch(`get.php?key=SecretKeyPFForum23&dateFilter=${dateFilter}`);
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('Ошибка получения данных:', error);
                return null;
            }
        }

        // Функция для отображения данных в таблице
        function displayMetrics(metrics) {
            const dataContainer = document.getElementById('metrics-data');
            dataContainer.innerHTML = ''; // Очищаем таблицу

            if (!metrics || !metrics.metrics || metrics.metrics.length === 0) {
                dataContainer.textContent = 'Данные не найдены';
                return;
            }

            metrics.metrics.forEach(metric => {
                const dl = document.createElement('dl');
                dl.classList.add('row');

                // Добавляем данные в dl 
                for (const key in metric) {
                    if (metric.hasOwnProperty(key)) {
                        const dt = document.createElement('dt');
                        const dd = document.createElement('dd');

                        dt.textContent = key; // Параметр 
                        dd.textContent = metric[key]; // Значение

                        dl.appendChild(dt);
                        dl.appendChild(dd);
                    }
                }

                dataContainer.appendChild(dl);
            });
        }

        // Обработка переключения фильтров
        const dateFilterRadios = document.querySelectorAll('input[name="date_filter"]');
        dateFilterRadios.forEach(radio => {
            radio.addEventListener('change', async () => {
                const dateFilter = radio.value;
                const metrics = await fetchMetrics(dateFilter);
                if (metrics) {
                    displayMetrics(metrics);
                }
            });
        });

        // Инициализация при загрузке страницы
        window.onload = async () => {
            const metrics = await fetchMetrics('today');
            if (metrics) {
                displayMetrics(metrics);
            }
        };
    </script>
</body>

</html>