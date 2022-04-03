const WebSocket = require('ws');
const notifier = require('node-notifier');


process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;


function ws_connect(){

    let ws = new WebSocket('wss://eqstream.xyz:3001');


    // 接続時に通知
    ws.addEventListener('open', e => {
        console.log('connected!');
        notifier.notify({
            'title': 'EqStream Desktop',
            'message': 'connected!'
        });
    })

    // サーバからのデータ受信時の処理
    ws.addEventListener('message', e => {
        const obj = JSON.parse(e.data);

        console.log('=======new event=======');
        console.log(obj.type);

        switch (obj.type) {
            case 'eew':
                console.log(obj.report + '報');
                console.log(obj.epicenter + ' 震度' + obj.intensity);

                if (obj.report === 'final') {
                    var titletext = '緊急地震速報 最終報';
                } else {
                    var titletext = '緊急地震速報 第' + obj.report + '報';
                }

                var messagetext = obj.epicenter + 'で震度' + obj.intensity;

                notifier.notify({
                    'title': titletext,
                    'message': messagetext
                });

                break;


            case 'pga_alert':
                console.log('地震検知情報');
                console.log(obj.region_list.toString() + ' 震度' + obj.estimated_intensity + ' 最大PGA' + obj.max_pga);
                break;

            
            case 'intensity_report':
                var titletext = obj.intensity_list[0].region_list.toString() + 'で最大震度' + obj.max_index + 'を観測する地震が発生しました。';

                var intensityCounts = obj.intensity_list.length;
                var messagetext = '↳';
                var index = 0;
                
                while (true) {
                    var intensity = obj.intensity_list[index].intensity;
                    console.log('震度' + intensity);  
                                
                    var regions = obj.intensity_list[index].region_list.toString();
                    console.log(regions);

                    messagetext = messagetext + '震度' + intensity + ' - ' + regions + '  ';

                    var index = index + 1
                    if (index === intensityCounts) {break;}
                    
                }   

                notifier.notify({
                    'title': titletext,
                    'message': messagetext
                });

            
                break;


            case 'tsunami':

                var areasCounts = obj.areas.length;
                var index = 0

                while (true) {

                    var grade = obj.areas[index].grade;
                    var placeName = obj.areas[index].name;

                    switch (grade) {
                        case 'MajorWarning':
                            if (!MajorWarningAreas) {
                                var MajorWarningAreas = placeName;
                            } else {
                                var MajorWarningAreas = MajorWarningAreas + '、' + placeName;
                            }

                            break;

                        case 'Warning':
                            if (!WarningAreas) {
                                var WarningAreas = placeName;
                            } else {
                                var WarningAreas = WarningAreas + '、' + placeName;
                            }

                            break;

                        case 'Watch':
                            if (!WatchAreas) {
                                var WatchAreas = placeName;
                            } else {
                                var WatchAreas = WatchAreas + '、' + placeName;
                            }

                            break;

                        default: 
                    }

                    var index = index + 1
                    if (index === areasCounts) {break;}

                }

                if (MajorWarningAreas) {
                    var titletext = '⚠大津波警報が発表されました! ';
                    var messagetext = '対象地域: ' + MajorWarningAreas;

                    notifier.notify({
                        'title': titletext,
                        'message': messagetext
                    });
                }

                if (WarningAreas) {
                    var titletext = '⚠津波警報が発表されました! ';
                    var messagetext = '対象地域: ' + WarningAreas;

                    notifier.notify({
                        'title': titletext,
                        'message': messagetext
                    });
                }

                if (WatchAreas) {
                    var titletext = '津波注意報が発表されました! ';
                    var messagetext = '対象地域: ' + WatchAreas;

                    notifier.notify({
                        'title': titletext,
                        'message': messagetext
                    });
                }


            default:
                console.log('不明な情報');

        }
    })

    // 切断時に再接続
    ws.addEventListener('close', e => {
        console.log('APIサーバーから切断されました。接続を再試行します。');
        notifier.notify({
            'title': 'EqStream Desktop',
            'message': 'Disconnected. Retry.'
        });
        ws_connect();      
    })

}

ws_connect();