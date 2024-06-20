"use strict";
function updateSmeni(chart, dataPoints1, dataPoints2, type, period, best_smena) {
    console.log('UPD: Смена: ' + type + '; Период: ' + period);
    $.getJSON(`/pages/display/grafics/smeni_ajax.php?group=${type}&period=${period}&best_smena=${best_smena}`, function (data) {

        dataPoints1.length = 0;
        dataPoints2.length = 0;

        data["dataPoints1"].forEach((value) => {
            dataPoints1.push({
                y: parseInt(value["y"]),
                label: value["label"],
                indexLabel: value["indexLabel"]
            });
        });

        data["dataPoints2"].forEach((value) => {
            dataPoints2.push({
                y: parseInt(value["y"]),
                label: value["label"],
                indexLabel: value["indexLabel"]
            });
        });

        chart.render();
        setTimeout(() => updateSmeni(chart, dataPoints1, dataPoints2, type, period, best_smena), 60000);
    });
}

$(document).ready(function(){
    
    if ($('#clockdate').length) {
        function startTime() {
            var today = new Date();
            var hr = today.getHours();
            var min = today.getMinutes();
            var sec = today.getSeconds();
            //Add a zero in front of numbers<10
            hr = checkTime(hr);
            min = checkTime(min);
            sec = checkTime(sec);
            document.getElementById("clock").innerHTML = hr + ":" + min + ":" + sec;

            var months = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];
            var days = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
            var curWeekDay = days[today.getDay()];
            var curDay = today.getDate();
            var curDay = today.getDate();
            var curMonth = months[today.getMonth()];
            var curYear = today.getFullYear();
            var date = curWeekDay+", "+curDay+" "+curMonth+" "+curYear;
            document.getElementById("date").innerHTML = date;

            var time = setTimeout(function(){ startTime() }, 500);
        }
        function checkTime(i) {
            if (i < 10) {
                i = "0" + i;
            }
            return i;
        }
        startTime();
    }
    
    // Монитор на слесарном участке
    const $slesMon = $('#sles_mon');
    const $progressSless = $('#sles_progress');

    if ($slesMon.length) {
      function updateSlesMon() {
        $.getJSON("/pages/sles/ajax_monitor.php", function (resSles) {
          const progress = resSles.sles_progress;
          $slesMon.html(resSles.sles_mon);
          $progressSless.html(progress + '%').css('color', progress.replace(",", ".") > 0 ? 'green' : 'red');
        });
      }

      setInterval(updateSlesMon, 60000);
      updateSlesMon();
    }
    // Конец. Монитор на слесарном участке
    
    // Монитор на участке ОТК
    const $otkMon = $('#otk_mon');
    const $progressOtk = $('#otk_progress');

    if ($otkMon.length) {
      function updateOtkMon() {
        $.getJSON("/pages/otk/ajax_monitor.php", function (resOtk) {
          const progress = resOtk.otk_progress;
          $otkMon.html(resOtk.otk);
          $progressOtk.html(progress + '%').css('color', progress.replace(",", ".") > 0 ? 'green' : 'red');
        });
      }

      setInterval(updateOtkMon, 60000);
      updateOtkMon();
    }
    // Конец. Монитор на участке ОТК
    
    // Монитор на участке упаковка
    const $upkMon = $('#upk_mon');
    const $progressUpk = $('#upk_progress');

    if ($upkMon.length) {
      function updateUpkMon() {
        $.getJSON("/pages/upk/ajax_monitor.php", function (resUpk) {
          const progress = resUpk.upk_progress;
          $upkMon.html(resUpk.upk);
          $progressUpk.html(progress + '%').css('color', progress.replace(",", ".") > 0 ? 'green' : 'red');
        });
      }

      setInterval(updateUpkMon, 60000);
      updateUpkMon();
    }
    // Конец. Монитор на участке упаковка
    
    // Загрузка станков
    function updateCncMonT() {
      $('#cnc_mon_t').load("/pages/cnc/ajax_monitor_t.php");
      setTimeout(updateCncMonT, 60000);
    }
    if ($('#cnc_mon_t').length) {
      updateCncMonT();
    }

    function updateCncMonF() {
      $('#cnc_mon_f').load("/pages/cnc/ajax_monitor_f.php");
      setTimeout(updateCncMonF, 60000);
    }
    if ($('#cnc_mon_f').length) {
      updateCncMonF();
    }
    
    const $cncMonF = $('#cnc_mon_f');
    const $cncMonT = $('#cnc_mon_t');

    if (!$('body').hasClass('to-monitor')) {
      if ($cncMonF.length) {
        $cncMonF.find('.col-md-4').removeClass('col-md-4').addClass('col-md-6');
      }
      if ($cncMonT.length) {
        $cncMonT.find('.col-md-4').removeClass('col-md-4').addClass('col-md-6');
      }
    }
    // Конец.Загрузка станков
    
    setInterval(function() {
      $.get('/pages/display/grafics/hb_ajax.php', function(response) {
          console.log(response);
          // Если ответ положительный, то добавляем слайд в слайдер
          if (response) {
            console.log('ДР');
            // Проверяем наличие слайда с классом 'birth'
            if ($('#slider').find('.birth').length) {
              // Если такой слайд есть, то удаляем его и перезагружаем слайдер
              $('#slider').find('.birth').remove();
              $('#slider').flexslider();
            }
            // Добавляем новый слайд с содержимым, полученным из AJAX-ответа
            $('#slider ul.slides').append(response);
            $('#slider').flexslider();
          }
      });
    }, 10000); // 1 час в миллисекундах
    
});

window.onload = function () {
        
    if($('#analize_prod_mon').length){
        let dataPoints1 = [];
        let dataPoints2 = [];
        let dataPoints3 = [];
        let dataPoints4 = [];
        let chart = new CanvasJS.Chart("analize_prod_mon",
        {
          theme: "dark2",
          backgroundColor: "rgba(0,0,0,0)",
          axisX: {
            valueFormatString: "DD",
            gridColor: "#333",
            interval:1,
            labelFontSize: 16,
            intervalType: "day"
          },
          axisY:{
            includeZero: true,
            gridColor: "#333",
            labelFontSize: 16,
            tickThickness: 0,
            labelFormatter: function() { 
              return "";
            },
          },
          data: [{
            type: "line",
            name: "Ежемесячный план",
            showInLegend: true,
            visible: true,
            markerSize: 0,
            color:"#82cd75",
            dataPoints: dataPoints1
            },
            {
            type: "line",
            lineDashType: "dash",
            name: "Ежедневный план",
            showInLegend: true,
            markerSize: 0,
            visible: true,
            color:"#ccc",
            dataPoints: dataPoints2
            },
            {
            type: "line",
            name: "Поступление на склад",
            showInLegend: true,
            lineThickness: 3,
            markerSize: 5,
            visible: true,
            color:"#0d6efd",
            indexLabelBackgroundColor: "#0d6efd",
            indexLabelFontColor: "#fff",
            indexLabelFontSize: "14",
            dataPoints: dataPoints3
            },
            {
            type: "line",
            name: "Сумма заключенных договоров и спецификаций",
            showInLegend: true,
            visible: true,
            lineThickness: 3,
            markerSize: 5,
            color:"#fd0d18",
            indexLabelBackgroundColor: "#161a1e",
            indexLabelFontColor: "#fd0d18",
            indexLabelFontSize: "14",
            indexLabelLineThickness: 1,
            indexLabelLineColor: '#fd0d18',
            dataPoints: dataPoints4
            }
          ]
        });
        
        function update_analize_prod(){
            $.getJSON("/pages/other/analize_plan_ajax.php?type=json", function(data) {
                var dataPoints = [dataPoints1, dataPoints2, dataPoints3, dataPoints4];
                dataPoints.forEach(function(dataPoint) {
                    dataPoint.length = 0;
                });

                for (var j=0; j<4; j++){
                    $.each(data['dataPoints'+(j+1)], function(key,val){
                        dataPoints[j].push({
                            x:parseInt(val['x']), 
                            y: parseInt(val['y']), 
                            label: val['label'], 
                            labelLabel: j > 1 ? parseInt(val['y']) : undefined
                        });
                    });
                }

                var updates = {
                    'otklon': data['otklon']+'%',
                    'brack_perc': data['brack_perc']+'%',
                    'otklon_m': data['otklon_m']+'%',
                    'otklon_date': data['otklon_date']
                };

                for(var id in updates){
                    $('#'+id).html(updates[id]);
                }

                $('.plan-graf').fadeIn().delay( 300000 ).fadeOut();
                chart.render();

                setTimeout(update_analize_prod, 1800000);
            });
        }
        update_analize_prod();
        
        $('#analize_close').click(function(){
            $(this).parent().hide();
        });
    }
    
    if($('#slider').length){
        if($('#analize_prod_slide').length){
            let dataPoints1 = [];
            let dataPoints2 = [];
            let dataPoints3 = [];
            let dataPoints4 = [];
            let chart_analize_prod_slide = new CanvasJS.Chart("analize_prod_slide",
            {
              theme: "dark2",
              backgroundColor: "rgba(0,0,0,0)",
              axisX: {
                valueFormatString: "DD",
                interval:1,
                labelFontSize: 16,
                intervalType: "day"
              },
              axisY:{
                includeZero: false,
                gridColor: "#333",
                labelFontSize: 16,
                interval: 20,
                labelFormatter: function ( e ) {
                       return e.value + "%";  
                 } 
              },
              toolTip: {
                    enabled: false
              },
              data: [{
                type: "line",
                name: "Ежемесячный план",
                showInLegend: true,
                visible: true,
                dataPoints:  dataPoints1,
                color:"#82cd75",
                markerSize: 0,
                },
                {
                type: "line",
                lineDashType: "dash",
                name: "Ежедневный план",
                showInLegend: true,
                visible: true,
                dataPoints:  dataPoints2,
                color:"#ccc",
                markerSize: 0,
                },
                {
                type: "line",
                name: "Поступление на склад",
                showInLegend: true,
                visible: true,
                indexLabelBackgroundColor: "#161a1e",
                indexLabelFontSize: "18",
                dataPoints:  dataPoints3,
                color:"#0d6efd",
                },
                {
                type: "line",
                name: "Сумма заключенных договоров",
                showInLegend: true,
                visible: true,
                color:"#fd0d18",
                indexLabelFontSize: "18",
                indexLabelBackgroundColor: "#161a1e",
                dataPoints: dataPoints4
                }
              ]
            });

            let analize_prod_slide = function (){
                console.log('UPD:Анализ производства');
                $.getJSON("/pages/display/grafics/analize_prod_query.php", function(data) {
                    dataPoints1.length = 0;
                    dataPoints2.length = 0;
                    dataPoints3.length = 0;
                    dataPoints4.length = 0;
                    for (var j=1; j<=4; j++){
                        $.each(data['dataPoints'+j], function(key,val){
                            if(j == 1){
                                dataPoints1.push({x:parseInt(val['x']), y: parseInt(val['y']), label: val['label']});
                            }
                            if(j == 2){
                                dataPoints2.push({x:parseInt(val['x']), y: val['y'], label: val['label']});
                            }
                            if(j == 3){
                                dataPoints3.push({x:parseInt(val['x']), y: parseInt(val['y']), label: val['label'], indexLabel: val['indexLabel']});
                            }
                            if(j == 4){
                                dataPoints4.push({x:parseInt(val['x']), y: parseInt(val['y']), label: val['label'], indexLabel: val['indexLabel']});
                            }
                        });
                    }
                    $('.date').html(data['otklon_date']);
                    $('#otklon').html(data['otklon']+'%');
                    if(data['otklon'] > 0){
                        $('#otklon').css("color","#82cd75");
                    }else{
                        $('#otklon').css("color","#fd0d18");
                    }

                    $('#brack_perc').html(data['brack_perc']+'%');
                    if(data['brack_perc'] > 0){
                        $('#brack_perc').css("color","#fd0d18");
                    }else{
                        $('#brack_perc').css("color","#82cd75");
                    }

                    $('#otklon_m').html(data['otklon_m']+'%');
                    if(data['otklon_m'] > 0){
                        $('#otklon_m').css("color","#82cd75");
                    }else{
                        $('#otklon_m').css("color","#fd0d18");
                    }
                    chart_analize_prod_slide.render();
                });
            setTimeout(function() {analize_prod_slide()}, 60000);
            }
            analize_prod_slide();
        }
        

        $('div[id^="smena"]').each(function () {
            let type = $(this).data('type');
            let period = $(this).data('period');
            let best_smena = $(this).data('best');
            let id = $(this).attr('id');
            let dataPoints1 = [];
            let dataPoints2 = [];
            let chart = new CanvasJS.Chart(id, {
                theme: "dark2",
                backgroundColor: "rgba(0,0,0,0)",
                axisY: {
                    labelFontSize: 20,
                    gridColor: "#222",
                    includeZero: true,
                    minimum: 0,
                },
                axisX: {
                    labelFontSize: 20,
                    interval: 1,
                },
                toolTip: {
                    enabled: false
                },
                data: [
                    {
                        type: "stackedBar",
                        indexLabelFontSize: 14,
                        indexLabelFontColor: "#161a1e",
                        indexLabelPlacement: "inside",
                        indexLabelTextAlign: "center",
                        indexLabelFontWeight: "bold",
                        color: "#82cd75",
                        dataPoints: dataPoints1
                    },
                    {
                        type: "stackedBar",
                        indexLabelFontSize: 14,
                        indexLabelFontColor: "#fff",
                        indexLabelPlacement: "outside",
                        color: "#fd0d18",
                        dataPoints: dataPoints2
                    }
                ]
            });

            updateSmeni(chart, dataPoints1, dataPoints2, type, period, best_smena);
        });
        
        if($('div[id^="manager_"]').length){
            $('div[id^="manager_"]').each(function(){
                let days = $(this).data('days');
                let fio = $(this).data('fio');
                let id = $(this).attr('id');
                let man_id = $(this).data('id');
                let dataPoints1 = [];
                let dataPoints2 = [];
                let manager = new CanvasJS.Chart(id,{
                    title:{
                        text: fio           
                    },
                    theme: "dark2",
                    backgroundColor: "rgba(0,0,0,0)",
                    axisX: {
                        interval: 1,
                        intervalType: "day",
                        minimum: 1,
                        labelFontSize: 14,
                        labelFontColor: "#999",
                        maximum: days,
                    },
                    axisY:{
                        gridColor: "#333",
                        labelFontSize: 14,
                        labelFontColor: "#999",
				        interval: 20,
                        labelFormatter: function ( e ) {
                               return e.value + "%";  
                        }
                      },
                    data: [
                        {
                        type: "line",
                        name: "План",
                        visible: true,
                        color:"#82cd75",
                        indexLabelFontSize: "11",
                        markerSize:0,
                        dataPoints: dataPoints2
                        },
                        {
                        type: "line",
                        name: fio,
                        visible: true,
                        color:"#fd0d18",
                        indexLabelFontSize: "14",
                        indexLabelFontColor: "#fff",
                        indexLabelLineThickness: 1,
                        indexLabelBackgroundColor: "#161a1e",
                        indexLabelLineColor: "#fd0d18",
                        dataPoints: dataPoints1
                        }
                    ]
                });

                function updateManager(){
                    console.log('UPD:Менеджер_'+man_id+': ' + fio);
                    $.get("/pages/display/grafics/manager_ajax.php?id="+man_id, function(data) {

                        dataPoints1.length = 0;
                        $.each(data["dataPoints1"], function(key, value){
                            dataPoints1.push({
                                y: parseInt(value["y"]),
                                label: value["label"],
                                indexLabel: value["indexLabel"]
                            });
                        });

                        dataPoints2.length = 0;
                        $.each(data["dataPoints2"], function(key, value){
                            dataPoints2.push({
                                y: parseInt(value["y"]),
                                label: value["label"],
                                indexLabel: value["indexLabel"]
                            });
                        });
                        manager.render();

                        setTimeout(function(){updateManager()}, 60000);
                    }, "json");
                } 
                updateManager();
            });
        }
        
        if($('div[id^="oper"]').length){
            $('div[id^="oper"]').each(function(){
                let type = $(this).data('type');
                let period = $(this).data('period');
                let master = $(this).data('master');
                let id = $(this).attr('id');
                
                let dataPoints1 = [];
                let dataPoints2 = [];
                let chart = new CanvasJS.Chart(id,
                    {
                    theme: "dark2",
                    backgroundColor: "rgba(0,0,0,0)",
                    axisY: {
                        labelFontSize: 20,
                        gridColor: "#222",
                        includeZero: true,
                        minimum: 0,
                    },
                    axisX: {
                        labelFontSize: 20,
                        interval:1,
                    },
                    toolTip: {
                        enabled: false
                    },
                    data: [
                    {
                        type: "stackedBar",
                        indexLabelFontSize: 14,
                        indexLabelFontColor: "#161a1e",
                        indexLabelPlacement: "inside",
                        indexLabelTextAlign: "center",
                        indexLabelFontWeight: "bold",
                        color:"#82cd75",
                        dataPoints: dataPoints1
                    },
                    {
                        type: "stackedBar",
                        indexLabelFontSize: 14,
                        indexLabelFontColor: "#fff",
                        indexLabelPlacement: "outside",
                        color:"#fd0d18",
                        dataPoints: dataPoints2
                    }
                    ]
                });

                function updateOper(){
                    console.log('UPD:Операторы: ' + type + '; Период: ' + period );
                    $.get("/pages/display/grafics/oper_ajax.php?group=" + type + "&period=" + period + "&master=" + master, function(data) {

                        dataPoints1.length = 0;
                        $.each(data["dataPoints1"], function(key, value){
                            dataPoints1.push({
                                y: parseInt(value["y"]),
                                label: value["label"],
                                indexLabel: value["indexLabel"]
                            });
                        });

                        dataPoints2.length = 0;
                        $.each(data["dataPoints2"], function(key, value){
                            dataPoints2.push({
                                y: parseInt(value["y"]),
                                label: value["label"],
                                indexLabel: value["indexLabel"]
                            });
                        });
                        chart.render();

                        setTimeout(function(){updateOper()}, 60000);
                    }, "json");
                } 
                updateOper();
            });
        }
        
        if($('div[id^="dorabot_"]').length){
            $('div[id^="dorabot_"]').each(function(){
                let period = $(this).data('period');
                let id = $(this).attr('id');
                
                let dataPoints1 = [];
                let dataPoints2 = [];
                let chart = new CanvasJS.Chart(id,
                    {
                    theme: "dark2",
                    backgroundColor: "rgba(0,0,0,0)",
                    axisY: {
                        labelFontSize: 20,
                        gridColor: "#222",
                        includeZero: true,
                        minimum: 0,
                    },
                    axisX: {
                        labelFontSize: 20,
                        interval:1,
                    },
                    toolTip: {
                        enabled: false
                    },
                    data: [
                    {
                        type: "stackedBar",
                        indexLabelFontSize: 14,
                        indexLabelFontColor: "#161a1e",
                        indexLabelPlacement: "inside",
                        indexLabelTextAlign: "center",
                        indexLabelFontWeight: "bold",
                        color:"#82cd75",
                        dataPoints: dataPoints1
                    },
                    {
                        type: "stackedBar",
                        indexLabelFontSize: 14,
                        indexLabelFontColor: "#fff",
                        indexLabelPlacement: "outside",
                        color:"#fd0d18",
                        dataPoints: dataPoints2
                    }
                    ]
                });

                function updateDorabot(){
                    console.log('UPD:Операторы подработка: Период: ' + period );
                    $.getJSON("/pages/display/grafics/oper_dorabot_ajax.php",{period: period}, function(data) {

                        dataPoints1.length = 0;
                        $.each(data["dataPoints1"], function(key, value){
                            dataPoints1.push({
                                y: parseInt(value["y"]),
                                label: value["label"],
                                indexLabel: value["indexLabel"]
                            });
                        });

                        dataPoints2.length = 0;
                        $.each(data["dataPoints2"], function(key, value){
                            dataPoints2.push({
                                y: parseInt(value["y"]),
                                label: value["label"],
                                indexLabel: value["indexLabel"]
                            });
                        });
                        chart.render();

                        setTimeout(function(){updateDorabot()}, 60000);
                    });
                } 
                updateDorabot();
            });
        }
        
        if($('div[id^="anti_dorabot_"]').length){
            $('div[id^="anti_dorabot_"]').each(function(){
                let type = $(this).data('type');
                let period = $(this).data('period');
                let id = $(this).attr('id');
                
                let dataPoints1 = [];
                let dataPoints2 = [];
                let anti_dorabot = new CanvasJS.Chart(id,
                    {
                    theme: "dark2",
                    backgroundColor: "rgba(0,0,0,0)",
                    axisY: {
                        labelFontSize: 20,
                        gridColor: "#222",
                        includeZero: true,
                        minimum: 0,
                    },
                    axisX: {
                        labelFontSize: 20,
                        interval:1,
                    },
                    toolTip: {
                        enabled: false
                    },
                    data: [
                    {
                        type: "stackedBar",
                        indexLabelFontSize: 14,
                        indexLabelFontColor: "#fff",
                        indexLabelPlacement: "inside",
                        indexLabelTextAlign: "center",
                        indexLabelFontWeight: "bold",
                        color:"#fd0d18",
                        dataPoints: dataPoints1
                    }
                    ]
                });

                function updateAntiDorabot(){
                    console.log('UPD:Антирейтинг доработка: Период: ' + period );
                    $.get("/pages/display/grafics/oper_anti_dorabot_ajax.php?type=" + type + "&period=" + period, function(data) {

                        dataPoints1.length = 0;
                        $.each(data["dataPoints1"], function(key, value){
                            dataPoints1.push({
                                y: parseInt(value["y"]),
                                label: value["label"],
                                indexLabel: value["indexLabel"]
                            });
                        });

                        anti_dorabot.render();

                        setTimeout(function(){updateAntiDorabot()}, 60000);
                    }, "json");
                } 
                updateAntiDorabot();
            });
        }
        
        if($('#analize_managers_line_all').length){
            let manager = [];
            let daysInMonth;
            
            let chart_analize_managers_line_all = new CanvasJS.Chart("analize_managers_line_all",
                {
                  theme: "dark2",
                  backgroundColor: "rgba(0,0,0,0)",
                  axisX: {
                    interval:1,
                    labelFontSize: 14,
                    intervalType: "day",
                    minimum: 1,
                    maximum: daysInMonth,
                  },
                  axisY:{
                    includeZero: true,
                    gridColor: "#333",
                    labelFontSize: 14,
                    interval: 20,
                    labelFormatter: function ( e ) {
                           return e.value + "%";  
                     }
                  },
                  toolTip: {
                        enabled: false,
                    },
                  data: [
                  ]
                });
            
                let analize_managers_line_all = function (){
                    console.log('UPD:Договора по менеджерам');
                    $.getJSON("/pages/display/grafics/analize_managers_line_all_ajax.php", function(data) {
                        manager.length = 0;
                        $.each(data['grafics'], function(i , val){
                            manager.push({
                                type: 'line',
                                name: val['name'],
                                color: val['color'],
                                dataPoints: val['point']
                            });
                        });
                        console.log(manager);
                        let count_manager = manager.length;
                        for (let j=0; j<=count_manager; j++){
                            $.each(manager[j], function(key,val){
                                
                            });
                        }
                        daysInMonth = data['daysInMonth'];
                        chart_analize_managers_line_all.render();
                    });
                }
                analize_managers_line_all();
        }
        if($('#CNC_T').length || $('#CNC_F').length){
            var dataPoints1 = [];
            var dataPoints2 = [];
            var dataPoints3 = [];
            var dataPoints4 = [];
            var dataPointSred_t = [];
            var dataPointSred_f = [];
            var dataPointSred_all = [];
            var chart_t = new CanvasJS.Chart("CNC_T", {
                theme: "dark2",
                backgroundColor: "rgba(0,0,0,0)",
                axisX:{
                    labelFontSize: 16,
                },
                axisY:{
                    lineColor: "rgba(0,0,0,0)",
                    gridColor: "rgba(0,0,0,0)",
                    interval: 10,
                    suffix: "%"
                },
                toolTip:{
                    shared: true
                },
                data:[{
                    type: "stackedBar100",
                    name: "Загрузка",
                    color:'#82cd75',
                    indexLabelFontSize: 16,
                    indexLabelFontColor: "#000",
                    dataPoints: dataPoints1
                    },
                    {
                    type: "stackedBar100",
                    name: "Простой",
                    color:'#c0504e',
                    indexLabelFontSize: 16,
                    indexLabelFontColor: "#fff",
                    dataPoints: dataPoints2
                    }
                ]
            });
            
            var chart_f = new CanvasJS.Chart("CNC_F", {
                theme: "dark2",
                backgroundColor: "rgba(0,0,0,0)",
                axisX:{
                    labelFontSize: 16,
                },
                axisY:{
                    lineColor: "rgba(0,0,0,0)",
                    gridColor: "rgba(0,0,0,0)",
                    interval: 10,
                    suffix: "%"
                },
                toolTip:{
                    shared: true
                },
                data:[{
                    type: "stackedBar100",
                    name: "Загрузка",
                    color:'#82cd75',
                    indexLabelFontSize: 16,
                    indexLabelFontColor: "#000",
                    dataPoints: dataPoints3
                    },
                    {
                    type: "stackedBar100",
                    name: "Простой",
                    color:'#c0504e',
                    indexLabelFontSize: 16,
                    indexLabelFontColor: "#fff",
                    dataPoints: dataPoints4
                    }
                ]
            });
            
            var chart_sred_t = new CanvasJS.Chart("chart_sred_t",{
                theme: "dark2",
                backgroundColor: "rgba(0,0,0,0)",
                data: [{
                    startAngle: 90,
                    innerRadius: 50,
                    indexLabelFontSize: 32,
                    type: "doughnut",
                    dataPoints: dataPointSred_t
                }]
            });
            var chart_sred_f = new CanvasJS.Chart("chart_sred_f",{
                theme: "dark2",
                backgroundColor: "rgba(0,0,0,0)",
                data: [{
                    startAngle: 90,
                    innerRadius: 50,
                    indexLabelFontSize: 32,
                    type: "doughnut",
                    dataPoints: dataPointSred_f
                }]
            });
            var chart_sred_all = new CanvasJS.Chart("chart_sred_all",{
                theme: "dark2",
                backgroundColor: "rgba(0,0,0,0)",
                data: [{
                    startAngle: 90,
                    innerRadius: 50,
                    indexLabelFontSize: 32,
                    type: "doughnut",
                    dataPoints: dataPointSred_all
                }]
            });
            
            function updateCNC(){
                $.get("/pages/display/grafics/cnc_ajax.php", function(data) {
                    console.log('Станки');
                    dataPoints1.length = 0;
                    $.each(data["dataPoints1"], function(key, value){
                        dataPoints1.push({
                            y: parseInt(value["y"]),
                            label: value["label"],
                            indexLabel: value["indexLabel"]
                        });
                    });

                    dataPoints2.length = 0;
                    $.each(data["dataPoints2"], function(key, value){
                        dataPoints2.push({
                            y: parseInt(value["y"]),
                            label: value["label"],
                            indexLabel: value["indexLabel"]
                        });
                    });

                    chart_t.render();

                    dataPoints3.length = 0;
                    $.each(data["dataPoints3"], function(key, value){
                        dataPoints3.push({
                            y: parseInt(value["y"]),
                            label: value["label"],
                            indexLabel: value["indexLabel"]
                        });
                    });

                    dataPoints4.length = 0;
                    $.each(data["dataPoints4"], function(key, value){
                        dataPoints4.push({
                            y: parseInt(value["y"]),
                            label: value["label"],
                            indexLabel: value["indexLabel"]
                        });
                    });
                    chart_f.render();

                    dataPointSred_t.length = 0;
                    $.each(data["dataPointSred_t"], function(key, value){
                        dataPointSred_t.push({
                            y: parseInt(value["y"]),
                            indexLabel: value["indexLabel"],
                            color: value["color"]
                        });
                    });
                    chart_sred_t.render();

                    dataPointSred_f.length = 0;
                    $.each(data["dataPointSred_f"], function(key, value){
                        dataPointSred_f.push({
                            y: parseInt(value["y"]),
                            indexLabel: value["indexLabel"],
                            color: value["color"]
                        });
                    });
                    chart_sred_f.render();

                    dataPointSred_all.length = 0;
                    $.each(data["dataPointSred_all"], function(key, value){
                        dataPointSred_all.push({
                            y: parseInt(value["y"]),
                            indexLabel: value["indexLabel"],
                            color: value["color"]
                        });
                    });
                    chart_sred_all.render();

                    setTimeout(function(){updateCNC()}, 60000);
                }, "json");
            } 
            updateCNC();
        }
        
        if($('#chartManagerBar').length){
            let dataPoints = [];
            let chartManagerBar = new CanvasJS.Chart("chartManagerBar",
                {
                theme: "dark2",
                backgroundColor: "rgba(0,0,0,0)",
                axisY: {
                    titleFontSize: 20,
                    gridColor: "#222",
                    suffix: "%",
                    includeZero: true,
                    interval:20,
                },
                toolTip: {
                    enabled: false
                },
                data: [{
                    type: "column",
                    indexLabelFontSize: 22,
                    indexLabelFontColor: "#161a1e",
                    indexLabelPlacement: "inside",
                    dataPoints: dataPoints
                }]
            });

            function updateChartManagerBar(){
                $.get("/pages/display/grafics/manager_bar_ajax.php", function(data) {
                    dataPoints.length = 0;
                    $.each(data, function(key, value){
                        dataPoints.push({
                            y: parseInt(value['y']),
                            label: value['label'],
                            indexLabel: parseInt(value['y'])+'%'
                        });
                    });
                    chartManagerBar.render();

                    setTimeout(function(){updateChartManagerBar()}, 60000);
                }, "json");
            } 
            updateChartManagerBar();
        }
        
        $('#slider').flexslider({
            animation: "fade",
            animationLoop: true,
            video: true,
            slideshow: true,
            slideshowSpeed: 300000,
            controlNav: false,
            directionNav: true,
            before: function(){
                /*if($('.flex-active-slide').data('type') == 'cnc'){
                    console.log('СТАНКИ');
                    updateCNC();
                }*/
                //reload video     
                $('video').each(function() { 
                    $(this).get(0).load(); 
                });
            },
            after: function(){
                //get active id and set it
                var active_id = $('.flex-active-slide').attr('id');

               //check for which slide is active 
                if( active_id == "slide1"){
                    //play video and pause the slider
                      myVideo1.play();
                      //$('.flexslider').flexslider("pause");
                      //on video ended go to next slide and play slider
                      /*myVideo1.onended = function(){
                        $('.flexslider').flexslider("next");
                        $('.flexslider').flexslider("play");
                      }*/
                }
            }
         });
    }
}