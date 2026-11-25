-- CineAstra | programação simulada: página 1 de 5, com até 50 filmes.
-- Execute os cinco arquivos em ordem, uma vez e sem --force, em uma base de apresentação.
-- Requer o instalador atualizado e os arquivos 01, 04 e 08. O arquivo 05 de volume é dispensável.
SET NAMES utf8mb4;
SET SESSION time_zone = '+00:00';
START TRANSACTION;
SET @comprador = 900011;
SET @pix = (SELECT MIN(id_metodo) FROM metodos_pagamento WHERE id_usuario=@comprador AND tipo='PIX' AND ativo=TRUE);

CREATE TEMPORARY TABLE mostra_validacao (ok TINYINT NOT NULL CHECK (ok = 1));
INSERT INTO mostra_validacao VALUES (@pix IS NOT NULL AND EXISTS (
    SELECT 1 FROM usuarios WHERE id_usuario=@comprador AND tipo_usuario='CLIENTE' AND status='ATIVO'
      AND data_nascimento<=UTC_DATE()-INTERVAL 18 YEAR
));

-- Modelos simulados do Studio 3D com IDs dos assentos da carga 01.
UPDATE salas SET cena_3d = CAST('{"format":"CineAstra-Studio-3D","version":2,"environment":"cinema","name":"Sala 1 · CineAstra Paulista","sceneSize":49,"objects":[{"id":1,"type":"floor","x":0,"y":-0.14,"z":0,"rotation":0,"sx":39,"sy":0.55,"sz":44,"color":"#24232f","label":""},
{"id":2,"type":"wall","x":0,"y":0,"z":-21.5,"rotation":0,"sx":39,"sy":8,"sz":0.42,"color":"#302b3c","label":""},
{"id":3,"type":"wall","x":-19.2,"y":0,"z":0,"rotation":0,"sx":0.42,"sy":3.3,"sz":43,"color":"#2c2939","label":""},
{"id":4,"type":"wall","x":19.2,"y":0,"z":0,"rotation":0,"sx":0.42,"sy":3.3,"sz":43,"color":"#2c2939","label":""},
{"id":5,"type":"screen","x":0,"y":0,"z":-20.25,"rotation":0,"sx":1.43,"sy":1.07,"sz":1,"color":"#34536d","label":"Tela principal · 4K"},
{"id":60,"type":"aisle","x":0,"y":0.017,"z":2,"rotation":0,"sx":3.1,"sy":1,"sz":37,"color":"#3b3441","label":""},
{"id":61,"type":"sconce","x":-17.8,"y":0,"z":-14,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":62,"type":"sconce","x":-17.8,"y":0,"z":-5,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":63,"type":"sconce","x":-17.8,"y":0,"z":4,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":64,"type":"sconce","x":-17.8,"y":0,"z":13,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":65,"type":"sconce","x":17.8,"y":0,"z":-14,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":66,"type":"sconce","x":17.8,"y":0,"z":-5,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":67,"type":"sconce","x":17.8,"y":0,"z":4,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":68,"type":"sconce","x":17.8,"y":0,"z":13,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":69,"type":"ceiling-light","x":0,"y":0,"z":-12,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#e6c693","label":""},
{"id":70,"type":"ceiling-light","x":0,"y":0,"z":0,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#e6c693","label":""},
{"id":71,"type":"ceiling-light","x":0,"y":0,"z":12,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#e6c693","label":""},
{"id":72,"type":"speaker","x":-12.4,"y":0,"z":-19,"rotation":0,"sx":1,"sy":1.3,"sz":1,"color":"#343b48","label":""},
{"id":73,"type":"speaker","x":12.4,"y":0,"z":-19,"rotation":0,"sx":1,"sy":1.3,"sz":1,"color":"#343b48","label":""},
{"id":74,"type":"riser","x":0,"y":-0.13,"z":-13,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#302d3a","label":""},
{"id":75,"type":"seat","x":-11.809999999999999,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-1","seatId":"900001"},
{"id":76,"type":"seat","x":-9.43,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-2","seatId":"900002"},
{"id":77,"type":"seat","x":-7.049999999999999,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-3","seatId":"900003"},
{"id":78,"type":"seat","x":-4.67,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-4","seatId":"900004"},
{"id":79,"type":"seat","x":-2.29,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-5","seatId":"900005"},
{"id":80,"type":"seat","x":2.29,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-6","seatId":"900006"},
{"id":81,"type":"seat","x":4.67,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-7","seatId":"900007"},
{"id":82,"type":"seat","x":7.049999999999999,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-8","seatId":"900008"},
{"id":83,"type":"seat","x":9.43,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-9","seatId":"900009"},
{"id":84,"type":"seat","x":11.809999999999999,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-10","seatId":"900010"},
{"id":85,"type":"riser","x":0,"y":0.07,"z":-9,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#34303e","label":""},
{"id":86,"type":"seat","x":-11.809999999999999,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-1","seatId":"900011"},
{"id":87,"type":"seat","x":-9.43,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-2","seatId":"900012"},
{"id":88,"type":"seat","x":-7.049999999999999,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-3","seatId":"900013"},
{"id":89,"type":"seat","x":-4.67,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-4","seatId":"900014"},
{"id":90,"type":"seat","x":-2.29,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-5","seatId":"900015"},
{"id":91,"type":"seat","x":2.29,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-6","seatId":"900016"},
{"id":92,"type":"seat","x":4.67,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-7","seatId":"900017"},
{"id":93,"type":"seat","x":7.049999999999999,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-8","seatId":"900018"},
{"id":94,"type":"seat","x":9.43,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-9","seatId":"900019"},
{"id":95,"type":"seat","x":11.809999999999999,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-10","seatId":"900020"},
{"id":96,"type":"riser","x":0,"y":0.27,"z":-5,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#302d3a","label":""},
{"id":97,"type":"seat","x":-11.809999999999999,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-1","seatId":"900021"},
{"id":98,"type":"seat","x":-9.43,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-2","seatId":"900022"},
{"id":99,"type":"seat","x":-7.049999999999999,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-3","seatId":"900023"},
{"id":100,"type":"seat","x":-4.67,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-4","seatId":"900024"},
{"id":101,"type":"seat","x":-2.29,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-5","seatId":"900025"},
{"id":102,"type":"seat","x":2.29,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-6","seatId":"900026"},
{"id":103,"type":"seat","x":4.67,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-7","seatId":"900027"},
{"id":104,"type":"seat","x":7.049999999999999,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-8","seatId":"900028"},
{"id":105,"type":"seat","x":9.43,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-9","seatId":"900029"},
{"id":106,"type":"seat","x":11.809999999999999,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-10","seatId":"900030"},
{"id":107,"type":"riser","x":0,"y":0.4700000000000001,"z":-1,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#34303e","label":""},
{"id":108,"type":"seat","x":-11.809999999999999,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-1","seatId":"900031"},
{"id":109,"type":"seat","x":-9.43,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-2","seatId":"900032"},
{"id":110,"type":"seat","x":-7.049999999999999,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-3","seatId":"900033"},
{"id":111,"type":"seat","x":-4.67,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-4","seatId":"900034"},
{"id":112,"type":"seat","x":-2.29,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-5","seatId":"900035"},
{"id":113,"type":"seat","x":2.29,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-6","seatId":"900036"},
{"id":114,"type":"seat","x":4.67,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-7","seatId":"900037"},
{"id":115,"type":"seat","x":7.049999999999999,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-8","seatId":"900038"},
{"id":116,"type":"seat","x":9.43,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-9","seatId":"900039"},
{"id":117,"type":"seat","x":11.809999999999999,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-10","seatId":"900040"},
{"id":118,"type":"riser","x":0,"y":0.67,"z":3,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#302d3a","label":""},
{"id":119,"type":"seat","x":-11.809999999999999,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-1","seatId":"900041"},
{"id":120,"type":"seat","x":-9.43,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-2","seatId":"900042"},
{"id":121,"type":"seat","x":-7.049999999999999,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-3","seatId":"900043"},
{"id":122,"type":"seat","x":-4.67,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-4","seatId":"900044"},
{"id":123,"type":"seat","x":-2.29,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-5","seatId":"900045"},
{"id":124,"type":"seat","x":2.29,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-6","seatId":"900046"},
{"id":125,"type":"seat","x":4.67,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-7","seatId":"900047"},
{"id":126,"type":"seat","x":7.049999999999999,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-8","seatId":"900048"},
{"id":127,"type":"seat","x":9.43,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-9","seatId":"900049"},
{"id":128,"type":"seat","x":11.809999999999999,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-10","seatId":"900050"},
{"id":129,"type":"riser","x":0,"y":0.87,"z":7,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#34303e","label":""},
{"id":130,"type":"seat","x":-11.809999999999999,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-1","seatId":"900051"},
{"id":131,"type":"seat","x":-9.43,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-2","seatId":"900052"},
{"id":132,"type":"seat","x":-7.049999999999999,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-3","seatId":"900053"},
{"id":133,"type":"seat","x":-4.67,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-4","seatId":"900054"},
{"id":134,"type":"seat","x":-2.29,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-5","seatId":"900055"},
{"id":135,"type":"seat","x":2.29,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-6","seatId":"900056"},
{"id":136,"type":"seat","x":4.67,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-7","seatId":"900057"},
{"id":137,"type":"seat","x":7.049999999999999,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-8","seatId":"900058"},
{"id":138,"type":"seat","x":9.43,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-9","seatId":"900059"},
{"id":139,"type":"seat","x":11.809999999999999,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-10","seatId":"900060"},
{"id":140,"type":"riser","x":0,"y":1.0700000000000003,"z":11,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#302d3a","label":""},
{"id":141,"type":"seat","x":-11.809999999999999,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-1","seatId":"900061"},
{"id":142,"type":"seat","x":-9.43,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-2","seatId":"900062"},
{"id":143,"type":"seat","x":-7.049999999999999,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-3","seatId":"900063"},
{"id":144,"type":"seat","x":-4.67,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-4","seatId":"900064"},
{"id":145,"type":"seat","x":-2.29,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-5","seatId":"900065"},
{"id":146,"type":"seat","x":2.29,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-6","seatId":"900066"},
{"id":147,"type":"seat","x":4.67,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-7","seatId":"900067"},
{"id":148,"type":"seat","x":7.049999999999999,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-8","seatId":"900068"},
{"id":149,"type":"seat","x":9.43,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-9","seatId":"900069"},
{"id":150,"type":"seat","x":11.809999999999999,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-10","seatId":"900070"},
{"id":151,"type":"riser","x":0,"y":1.27,"z":15,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#34303e","label":""},
{"id":152,"type":"vip","x":-11.809999999999999,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-1","seatId":"900071"},
{"id":153,"type":"vip","x":-9.43,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-2","seatId":"900072"},
{"id":154,"type":"vip","x":-7.049999999999999,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-3","seatId":"900073"},
{"id":155,"type":"vip","x":-4.67,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-4","seatId":"900074"},
{"id":156,"type":"vip","x":-2.29,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-5","seatId":"900075"},
{"id":157,"type":"vip","x":2.29,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-6","seatId":"900076"},
{"id":158,"type":"vip","x":4.67,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-7","seatId":"900077"},
{"id":159,"type":"vip","x":7.049999999999999,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-8","seatId":"900078"},
{"id":160,"type":"vip","x":9.43,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-9","seatId":"900079"},
{"id":161,"type":"vip","x":11.809999999999999,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-10","seatId":"900080"}]}' AS JSON)
WHERE id_sala=900001 AND cena_3d IS NULL;

UPDATE salas SET cena_3d = CAST('{"format":"CineAstra-Studio-3D","version":2,"environment":"cinema","name":"Sala 1 · CineAstra Shopping ABC","sceneSize":49,"objects":[{"id":1,"type":"floor","x":0,"y":-0.14,"z":0,"rotation":0,"sx":39,"sy":0.55,"sz":44,"color":"#24232f","label":""},
{"id":2,"type":"wall","x":0,"y":0,"z":-21.5,"rotation":0,"sx":39,"sy":8,"sz":0.42,"color":"#302b3c","label":""},
{"id":3,"type":"wall","x":-19.2,"y":0,"z":0,"rotation":0,"sx":0.42,"sy":3.3,"sz":43,"color":"#2c2939","label":""},
{"id":4,"type":"wall","x":19.2,"y":0,"z":0,"rotation":0,"sx":0.42,"sy":3.3,"sz":43,"color":"#2c2939","label":""},
{"id":5,"type":"screen","x":0,"y":0,"z":-20.25,"rotation":0,"sx":1.43,"sy":1.07,"sz":1,"color":"#34536d","label":"Tela principal · 4K"},
{"id":60,"type":"aisle","x":0,"y":0.017,"z":2,"rotation":0,"sx":3.1,"sy":1,"sz":37,"color":"#3b3441","label":""},
{"id":61,"type":"sconce","x":-17.8,"y":0,"z":-14,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":62,"type":"sconce","x":-17.8,"y":0,"z":-5,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":63,"type":"sconce","x":-17.8,"y":0,"z":4,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":64,"type":"sconce","x":-17.8,"y":0,"z":13,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":65,"type":"sconce","x":17.8,"y":0,"z":-14,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":66,"type":"sconce","x":17.8,"y":0,"z":-5,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":67,"type":"sconce","x":17.8,"y":0,"z":4,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":68,"type":"sconce","x":17.8,"y":0,"z":13,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":69,"type":"ceiling-light","x":0,"y":0,"z":-12,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#e6c693","label":""},
{"id":70,"type":"ceiling-light","x":0,"y":0,"z":0,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#e6c693","label":""},
{"id":71,"type":"ceiling-light","x":0,"y":0,"z":12,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#e6c693","label":""},
{"id":72,"type":"speaker","x":-12.4,"y":0,"z":-19,"rotation":0,"sx":1,"sy":1.3,"sz":1,"color":"#343b48","label":""},
{"id":73,"type":"speaker","x":12.4,"y":0,"z":-19,"rotation":0,"sx":1,"sy":1.3,"sz":1,"color":"#343b48","label":""},
{"id":74,"type":"riser","x":0,"y":-0.13,"z":-13,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#302d3a","label":""},
{"id":75,"type":"seat","x":-11.809999999999999,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-1","seatId":"900241"},
{"id":76,"type":"seat","x":-9.43,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-2","seatId":"900242"},
{"id":77,"type":"seat","x":-7.049999999999999,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-3","seatId":"900243"},
{"id":78,"type":"seat","x":-4.67,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-4","seatId":"900244"},
{"id":79,"type":"seat","x":-2.29,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-5","seatId":"900245"},
{"id":80,"type":"seat","x":2.29,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-6","seatId":"900246"},
{"id":81,"type":"seat","x":4.67,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-7","seatId":"900247"},
{"id":82,"type":"seat","x":7.049999999999999,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-8","seatId":"900248"},
{"id":83,"type":"seat","x":9.43,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-9","seatId":"900249"},
{"id":84,"type":"seat","x":11.809999999999999,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-10","seatId":"900250"},
{"id":85,"type":"riser","x":0,"y":0.07,"z":-9,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#34303e","label":""},
{"id":86,"type":"seat","x":-11.809999999999999,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-1","seatId":"900251"},
{"id":87,"type":"seat","x":-9.43,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-2","seatId":"900252"},
{"id":88,"type":"seat","x":-7.049999999999999,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-3","seatId":"900253"},
{"id":89,"type":"seat","x":-4.67,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-4","seatId":"900254"},
{"id":90,"type":"seat","x":-2.29,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-5","seatId":"900255"},
{"id":91,"type":"seat","x":2.29,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-6","seatId":"900256"},
{"id":92,"type":"seat","x":4.67,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-7","seatId":"900257"},
{"id":93,"type":"seat","x":7.049999999999999,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-8","seatId":"900258"},
{"id":94,"type":"seat","x":9.43,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-9","seatId":"900259"},
{"id":95,"type":"seat","x":11.809999999999999,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-10","seatId":"900260"},
{"id":96,"type":"riser","x":0,"y":0.27,"z":-5,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#302d3a","label":""},
{"id":97,"type":"seat","x":-11.809999999999999,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-1","seatId":"900261"},
{"id":98,"type":"seat","x":-9.43,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-2","seatId":"900262"},
{"id":99,"type":"seat","x":-7.049999999999999,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-3","seatId":"900263"},
{"id":100,"type":"seat","x":-4.67,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-4","seatId":"900264"},
{"id":101,"type":"seat","x":-2.29,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-5","seatId":"900265"},
{"id":102,"type":"seat","x":2.29,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-6","seatId":"900266"},
{"id":103,"type":"seat","x":4.67,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-7","seatId":"900267"},
{"id":104,"type":"seat","x":7.049999999999999,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-8","seatId":"900268"},
{"id":105,"type":"seat","x":9.43,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-9","seatId":"900269"},
{"id":106,"type":"seat","x":11.809999999999999,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-10","seatId":"900270"},
{"id":107,"type":"riser","x":0,"y":0.4700000000000001,"z":-1,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#34303e","label":""},
{"id":108,"type":"seat","x":-11.809999999999999,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-1","seatId":"900271"},
{"id":109,"type":"seat","x":-9.43,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-2","seatId":"900272"},
{"id":110,"type":"seat","x":-7.049999999999999,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-3","seatId":"900273"},
{"id":111,"type":"seat","x":-4.67,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-4","seatId":"900274"},
{"id":112,"type":"seat","x":-2.29,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-5","seatId":"900275"},
{"id":113,"type":"seat","x":2.29,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-6","seatId":"900276"},
{"id":114,"type":"seat","x":4.67,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-7","seatId":"900277"},
{"id":115,"type":"seat","x":7.049999999999999,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-8","seatId":"900278"},
{"id":116,"type":"seat","x":9.43,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-9","seatId":"900279"},
{"id":117,"type":"seat","x":11.809999999999999,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-10","seatId":"900280"},
{"id":118,"type":"riser","x":0,"y":0.67,"z":3,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#302d3a","label":""},
{"id":119,"type":"seat","x":-11.809999999999999,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-1","seatId":"900281"},
{"id":120,"type":"seat","x":-9.43,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-2","seatId":"900282"},
{"id":121,"type":"seat","x":-7.049999999999999,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-3","seatId":"900283"},
{"id":122,"type":"seat","x":-4.67,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-4","seatId":"900284"},
{"id":123,"type":"seat","x":-2.29,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-5","seatId":"900285"},
{"id":124,"type":"seat","x":2.29,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-6","seatId":"900286"},
{"id":125,"type":"seat","x":4.67,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-7","seatId":"900287"},
{"id":126,"type":"seat","x":7.049999999999999,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-8","seatId":"900288"},
{"id":127,"type":"seat","x":9.43,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-9","seatId":"900289"},
{"id":128,"type":"seat","x":11.809999999999999,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-10","seatId":"900290"},
{"id":129,"type":"riser","x":0,"y":0.87,"z":7,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#34303e","label":""},
{"id":130,"type":"seat","x":-11.809999999999999,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-1","seatId":"900291"},
{"id":131,"type":"seat","x":-9.43,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-2","seatId":"900292"},
{"id":132,"type":"seat","x":-7.049999999999999,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-3","seatId":"900293"},
{"id":133,"type":"seat","x":-4.67,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-4","seatId":"900294"},
{"id":134,"type":"seat","x":-2.29,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-5","seatId":"900295"},
{"id":135,"type":"seat","x":2.29,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-6","seatId":"900296"},
{"id":136,"type":"seat","x":4.67,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-7","seatId":"900297"},
{"id":137,"type":"seat","x":7.049999999999999,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-8","seatId":"900298"},
{"id":138,"type":"seat","x":9.43,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-9","seatId":"900299"},
{"id":139,"type":"seat","x":11.809999999999999,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-10","seatId":"900300"},
{"id":140,"type":"riser","x":0,"y":1.0700000000000003,"z":11,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#302d3a","label":""},
{"id":141,"type":"seat","x":-11.809999999999999,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-1","seatId":"900301"},
{"id":142,"type":"seat","x":-9.43,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-2","seatId":"900302"},
{"id":143,"type":"seat","x":-7.049999999999999,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-3","seatId":"900303"},
{"id":144,"type":"seat","x":-4.67,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-4","seatId":"900304"},
{"id":145,"type":"seat","x":-2.29,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-5","seatId":"900305"},
{"id":146,"type":"seat","x":2.29,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-6","seatId":"900306"},
{"id":147,"type":"seat","x":4.67,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-7","seatId":"900307"},
{"id":148,"type":"seat","x":7.049999999999999,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-8","seatId":"900308"},
{"id":149,"type":"seat","x":9.43,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-9","seatId":"900309"},
{"id":150,"type":"seat","x":11.809999999999999,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-10","seatId":"900310"},
{"id":151,"type":"riser","x":0,"y":1.27,"z":15,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#34303e","label":""},
{"id":152,"type":"vip","x":-11.809999999999999,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-1","seatId":"900311"},
{"id":153,"type":"vip","x":-9.43,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-2","seatId":"900312"},
{"id":154,"type":"vip","x":-7.049999999999999,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-3","seatId":"900313"},
{"id":155,"type":"vip","x":-4.67,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-4","seatId":"900314"},
{"id":156,"type":"vip","x":-2.29,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-5","seatId":"900315"},
{"id":157,"type":"vip","x":2.29,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-6","seatId":"900316"},
{"id":158,"type":"vip","x":4.67,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-7","seatId":"900317"},
{"id":159,"type":"vip","x":7.049999999999999,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-8","seatId":"900318"},
{"id":160,"type":"vip","x":9.43,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-9","seatId":"900319"},
{"id":161,"type":"vip","x":11.809999999999999,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-10","seatId":"900320"}]}' AS JSON)
WHERE id_sala=900004 AND cena_3d IS NULL;

UPDATE salas SET cena_3d = CAST('{"format":"CineAstra-Studio-3D","version":2,"environment":"cinema","name":"Sala 1 · CineAstra Campinas","sceneSize":49,"objects":[{"id":1,"type":"floor","x":0,"y":-0.14,"z":0,"rotation":0,"sx":39,"sy":0.55,"sz":44,"color":"#24232f","label":""},
{"id":2,"type":"wall","x":0,"y":0,"z":-21.5,"rotation":0,"sx":39,"sy":8,"sz":0.42,"color":"#302b3c","label":""},
{"id":3,"type":"wall","x":-19.2,"y":0,"z":0,"rotation":0,"sx":0.42,"sy":3.3,"sz":43,"color":"#2c2939","label":""},
{"id":4,"type":"wall","x":19.2,"y":0,"z":0,"rotation":0,"sx":0.42,"sy":3.3,"sz":43,"color":"#2c2939","label":""},
{"id":5,"type":"screen","x":0,"y":0,"z":-20.25,"rotation":0,"sx":1.43,"sy":1.07,"sz":1,"color":"#34536d","label":"Tela principal · 4K"},
{"id":60,"type":"aisle","x":0,"y":0.017,"z":2,"rotation":0,"sx":3.1,"sy":1,"sz":37,"color":"#3b3441","label":""},
{"id":61,"type":"sconce","x":-17.8,"y":0,"z":-14,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":62,"type":"sconce","x":-17.8,"y":0,"z":-5,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":63,"type":"sconce","x":-17.8,"y":0,"z":4,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":64,"type":"sconce","x":-17.8,"y":0,"z":13,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":65,"type":"sconce","x":17.8,"y":0,"z":-14,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":66,"type":"sconce","x":17.8,"y":0,"z":-5,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":67,"type":"sconce","x":17.8,"y":0,"z":4,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":68,"type":"sconce","x":17.8,"y":0,"z":13,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#d9ae7a","label":""},
{"id":69,"type":"ceiling-light","x":0,"y":0,"z":-12,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#e6c693","label":""},
{"id":70,"type":"ceiling-light","x":0,"y":0,"z":0,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#e6c693","label":""},
{"id":71,"type":"ceiling-light","x":0,"y":0,"z":12,"rotation":0,"sx":1,"sy":1,"sz":1,"color":"#e6c693","label":""},
{"id":72,"type":"speaker","x":-12.4,"y":0,"z":-19,"rotation":0,"sx":1,"sy":1.3,"sz":1,"color":"#343b48","label":""},
{"id":73,"type":"speaker","x":12.4,"y":0,"z":-19,"rotation":0,"sx":1,"sy":1.3,"sz":1,"color":"#343b48","label":""},
{"id":74,"type":"riser","x":0,"y":-0.13,"z":-13,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#302d3a","label":""},
{"id":75,"type":"seat","x":-11.809999999999999,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-1","seatId":"900481"},
{"id":76,"type":"seat","x":-9.43,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-2","seatId":"900482"},
{"id":77,"type":"seat","x":-7.049999999999999,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-3","seatId":"900483"},
{"id":78,"type":"seat","x":-4.67,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-4","seatId":"900484"},
{"id":79,"type":"seat","x":-2.29,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-5","seatId":"900485"},
{"id":80,"type":"seat","x":2.29,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-6","seatId":"900486"},
{"id":81,"type":"seat","x":4.67,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-7","seatId":"900487"},
{"id":82,"type":"seat","x":7.049999999999999,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-8","seatId":"900488"},
{"id":83,"type":"seat","x":9.43,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-9","seatId":"900489"},
{"id":84,"type":"seat","x":11.809999999999999,"y":0,"z":-13,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"A-10","seatId":"900490"},
{"id":85,"type":"riser","x":0,"y":0.07,"z":-9,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#34303e","label":""},
{"id":86,"type":"seat","x":-11.809999999999999,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-1","seatId":"900491"},
{"id":87,"type":"seat","x":-9.43,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-2","seatId":"900492"},
{"id":88,"type":"seat","x":-7.049999999999999,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-3","seatId":"900493"},
{"id":89,"type":"seat","x":-4.67,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-4","seatId":"900494"},
{"id":90,"type":"seat","x":-2.29,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-5","seatId":"900495"},
{"id":91,"type":"seat","x":2.29,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-6","seatId":"900496"},
{"id":92,"type":"seat","x":4.67,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-7","seatId":"900497"},
{"id":93,"type":"seat","x":7.049999999999999,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-8","seatId":"900498"},
{"id":94,"type":"seat","x":9.43,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-9","seatId":"900499"},
{"id":95,"type":"seat","x":11.809999999999999,"y":0.2,"z":-9,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"B-10","seatId":"900500"},
{"id":96,"type":"riser","x":0,"y":0.27,"z":-5,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#302d3a","label":""},
{"id":97,"type":"seat","x":-11.809999999999999,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-1","seatId":"900501"},
{"id":98,"type":"seat","x":-9.43,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-2","seatId":"900502"},
{"id":99,"type":"seat","x":-7.049999999999999,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-3","seatId":"900503"},
{"id":100,"type":"seat","x":-4.67,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-4","seatId":"900504"},
{"id":101,"type":"seat","x":-2.29,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-5","seatId":"900505"},
{"id":102,"type":"seat","x":2.29,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-6","seatId":"900506"},
{"id":103,"type":"seat","x":4.67,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-7","seatId":"900507"},
{"id":104,"type":"seat","x":7.049999999999999,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-8","seatId":"900508"},
{"id":105,"type":"seat","x":9.43,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-9","seatId":"900509"},
{"id":106,"type":"seat","x":11.809999999999999,"y":0.4,"z":-5,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"C-10","seatId":"900510"},
{"id":107,"type":"riser","x":0,"y":0.4700000000000001,"z":-1,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#34303e","label":""},
{"id":108,"type":"seat","x":-11.809999999999999,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-1","seatId":"900511"},
{"id":109,"type":"seat","x":-9.43,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-2","seatId":"900512"},
{"id":110,"type":"seat","x":-7.049999999999999,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-3","seatId":"900513"},
{"id":111,"type":"seat","x":-4.67,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-4","seatId":"900514"},
{"id":112,"type":"seat","x":-2.29,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-5","seatId":"900515"},
{"id":113,"type":"seat","x":2.29,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-6","seatId":"900516"},
{"id":114,"type":"seat","x":4.67,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-7","seatId":"900517"},
{"id":115,"type":"seat","x":7.049999999999999,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-8","seatId":"900518"},
{"id":116,"type":"seat","x":9.43,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-9","seatId":"900519"},
{"id":117,"type":"seat","x":11.809999999999999,"y":0.6000000000000001,"z":-1,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"D-10","seatId":"900520"},
{"id":118,"type":"riser","x":0,"y":0.67,"z":3,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#302d3a","label":""},
{"id":119,"type":"seat","x":-11.809999999999999,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-1","seatId":"900521"},
{"id":120,"type":"seat","x":-9.43,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-2","seatId":"900522"},
{"id":121,"type":"seat","x":-7.049999999999999,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-3","seatId":"900523"},
{"id":122,"type":"seat","x":-4.67,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-4","seatId":"900524"},
{"id":123,"type":"seat","x":-2.29,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-5","seatId":"900525"},
{"id":124,"type":"seat","x":2.29,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-6","seatId":"900526"},
{"id":125,"type":"seat","x":4.67,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-7","seatId":"900527"},
{"id":126,"type":"seat","x":7.049999999999999,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-8","seatId":"900528"},
{"id":127,"type":"seat","x":9.43,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-9","seatId":"900529"},
{"id":128,"type":"seat","x":11.809999999999999,"y":0.8,"z":3,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"E-10","seatId":"900530"},
{"id":129,"type":"riser","x":0,"y":0.87,"z":7,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#34303e","label":""},
{"id":130,"type":"seat","x":-11.809999999999999,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-1","seatId":"900531"},
{"id":131,"type":"seat","x":-9.43,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-2","seatId":"900532"},
{"id":132,"type":"seat","x":-7.049999999999999,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-3","seatId":"900533"},
{"id":133,"type":"seat","x":-4.67,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-4","seatId":"900534"},
{"id":134,"type":"seat","x":-2.29,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-5","seatId":"900535"},
{"id":135,"type":"seat","x":2.29,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-6","seatId":"900536"},
{"id":136,"type":"seat","x":4.67,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-7","seatId":"900537"},
{"id":137,"type":"seat","x":7.049999999999999,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-8","seatId":"900538"},
{"id":138,"type":"seat","x":9.43,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-9","seatId":"900539"},
{"id":139,"type":"seat","x":11.809999999999999,"y":1,"z":7,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"F-10","seatId":"900540"},
{"id":140,"type":"riser","x":0,"y":1.0700000000000003,"z":11,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#302d3a","label":""},
{"id":141,"type":"seat","x":-11.809999999999999,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-1","seatId":"900541"},
{"id":142,"type":"seat","x":-9.43,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-2","seatId":"900542"},
{"id":143,"type":"seat","x":-7.049999999999999,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-3","seatId":"900543"},
{"id":144,"type":"seat","x":-4.67,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-4","seatId":"900544"},
{"id":145,"type":"seat","x":-2.29,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-5","seatId":"900545"},
{"id":146,"type":"seat","x":2.29,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-6","seatId":"900546"},
{"id":147,"type":"seat","x":4.67,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-7","seatId":"900547"},
{"id":148,"type":"seat","x":7.049999999999999,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-8","seatId":"900548"},
{"id":149,"type":"seat","x":9.43,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-9","seatId":"900549"},
{"id":150,"type":"seat","x":11.809999999999999,"y":1.2000000000000002,"z":11,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#95445a","label":"G-10","seatId":"900550"},
{"id":151,"type":"riser","x":0,"y":1.27,"z":15,"rotation":0,"sx":33,"sy":1,"sz":3.6,"color":"#34303e","label":""},
{"id":152,"type":"vip","x":-11.809999999999999,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-1","seatId":"900551"},
{"id":153,"type":"vip","x":-9.43,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-2","seatId":"900552"},
{"id":154,"type":"vip","x":-7.049999999999999,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-3","seatId":"900553"},
{"id":155,"type":"vip","x":-4.67,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-4","seatId":"900554"},
{"id":156,"type":"vip","x":-2.29,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-5","seatId":"900555"},
{"id":157,"type":"vip","x":2.29,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-6","seatId":"900556"},
{"id":158,"type":"vip","x":4.67,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-7","seatId":"900557"},
{"id":159,"type":"vip","x":7.049999999999999,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-8","seatId":"900558"},
{"id":160,"type":"vip","x":9.43,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-9","seatId":"900559"},
{"id":161,"type":"vip","x":11.809999999999999,"y":1.4000000000000001,"z":15,"rotation":3.141592653589793,"sx":1,"sy":1,"sz":1,"color":"#a87849","label":"H-10","seatId":"900560"}]}' AS JSON)
WHERE id_sala=900007 AND cena_3d IS NULL;
CREATE TEMPORARY TABLE mostra_salas AS
SELECT sa.id_sala, sa.id_local, sa.capacidade,
       ROW_NUMBER() OVER (ORDER BY sa.id_local) - 1 AS posicao
FROM salas sa JOIN locais l ON l.id_local=sa.id_local
WHERE sa.id_sala IN (900001,900004,900007) AND sa.status='ATIVA'
  AND l.status='ATIVO' AND l.tipo_local='CINEMA'
  AND sa.cena_3d IS NOT NULL
  AND (SELECT COUNT(*) FROM assentos a WHERE a.id_sala=sa.id_sala AND a.status='ATIVA') >= 2
  AND NOT EXISTS (
    SELECT 1 FROM assentos a WHERE a.id_sala=sa.id_sala AND a.status='ATIVA' AND NOT EXISTS (
      SELECT 1 FROM JSON_TABLE(sa.cena_3d,'$.objects[*]' COLUMNS (assento VARCHAR(10) PATH '$.seatId')) j
      WHERE j.assento=CAST(a.id_assento AS CHAR)
    )
  )
  AND (SELECT COUNT(*) FROM JSON_TABLE(sa.cena_3d,'$.objects[*]' COLUMNS (
    assento VARCHAR(10) PATH '$.seatId'
  )) j WHERE j.assento IS NOT NULL) = (SELECT COUNT(*) FROM assentos a WHERE a.id_sala=sa.id_sala AND a.status='ATIVA');

INSERT INTO mostra_validacao SELECT COUNT(*)=3 FROM mostra_salas;

-- Mesmos filtros da aba Em cartaz, sem busca nem gênero. A página prioriza filmes com venda.
CREATE TEMPORARY TABLE mostra_pagina AS
SELECT f.id_filme, f.duracao
FROM filmes f
WHERE f.status='ATIVO' AND f.disponivel_cinema=TRUE
  AND (f.data_lancamento IS NULL OR f.data_lancamento<=UTC_DATE())
ORDER BY EXISTS (
    SELECT 1 FROM sessoes s JOIN salas sa ON sa.id_sala=s.id_sala JOIN locais l ON l.id_local=sa.id_local
    WHERE s.id_filme=f.id_filme AND s.status IN ('AGENDADA','EM_CARTAZ') AND sa.status='ATIVA' AND l.status='ATIVO'
      AND TIMESTAMP(s.data,s.horario_inicio)>UTC_TIMESTAMP(3)
      AND EXISTS (
          SELECT 1 FROM assentos a WHERE a.id_sala=sa.id_sala AND a.status='ATIVA'
            AND NOT EXISTS (SELECT 1 FROM assento_ocupacoes o
                WHERE o.id_sessao=s.id_sessao AND o.id_assento=a.id_assento
                  AND (o.estado='CONFIRMADA' OR (o.estado='RESERVADA' AND o.expira_em>UTC_TIMESTAMP(3))))
      )
) DESC, f.id_filme
LIMIT 50 OFFSET 0;

INSERT INTO mostra_validacao
SELECT COUNT(*)=50 AND MIN(duracao)>0 AND MAX(duracao)<=1350 FROM mostra_pagina;

SET @dia_inicial = (
    SELECT GREATEST(UTC_DATE() + INTERVAL 2 DAY,
           COALESCE(MAX(DATE_ADD(data,INTERVAL (1+(horario_fim<horario_inicio)) DAY)),UTC_DATE()))
    FROM sessoes s JOIN salas sa ON sa.id_sala=s.id_sala
    WHERE sa.id_local IN (900001,900002,900003) AND s.status<>'CANCELADA' AND s.data>=UTC_DATE()
);
SET @slots_dia = (SELECT IF(MAX(duracao)<=330,2,1) FROM mostra_pagina);

CREATE TEMPORARY TABLE mostra_programacao AS
WITH pendentes AS (
    SELECT f.*, ROW_NUMBER() OVER (ORDER BY f.id_filme)-1 AS posicao
    FROM mostra_pagina f
    WHERE NOT EXISTS (SELECT 1 FROM pedidos p WHERE p.id_usuario=@comprador AND p.checkout_key=CONCAT('mostra-250:',f.id_filme))
), agenda AS (
    SELECT f.id_filme, m.id_sala, m.id_local, m.capacidade, f.duracao,
           DATE_ADD(@dia_inicial,INTERVAL (f.posicao DIV (3*@slots_dia)) DAY) AS dia,
           IF(MOD(f.posicao DIV 3,@slots_dia)=0, '10:00:00','17:00:00') AS inicio
    FROM pendentes f JOIN mostra_salas m ON m.posicao=MOD(f.posicao,3)
), precos AS (
    SELECT a.*,
           SEC_TO_TIME(MOD(TIME_TO_SEC(a.inicio)+(a.duracao+30)*60,86400)) AS fim,
           ROUND((ROUND(8000*(a.duracao+30)/1440,0)+12000)/LEAST(a.capacidade,p.ocupacao_referencia),0) AS custo,
           p.markup_bps
    FROM agenda a JOIN precificacao_parametros p ON p.categoria='SESSION'
)
SELECT p.id_filme,p.id_sala,p.id_local,p.dia,p.inicio,p.fim,
       (p.custo + ROUND(p.custo*p.markup_bps/10000,0))/100 AS preco,
       CONCAT('mostra-250:',p.id_filme) AS chave,
       (SELECT MIN(a.id_assento) FROM assentos a WHERE a.id_sala=p.id_sala AND a.status='ATIVA' AND a.tipo='COMUM') AS id_assento
FROM precos p;

INSERT INTO mostra_validacao
SELECT NOT EXISTS (
    SELECT 1 FROM mostra_programacao p LEFT JOIN ofertas_filmes_unidade o
      ON o.id_filme=p.id_filme AND o.id_local=p.id_local AND o.ativa=FALSE
    WHERE o.id_filme IS NOT NULL OR p.id_assento IS NULL OR p.preco<=0
)
  AND EXISTS (SELECT 1 FROM precificacao_parametros WHERE categoria='SESSION' AND ocupacao_referencia>0);

INSERT INTO ofertas_filmes_unidade (id_local,id_filme,ativa)
SELECT p.id_local,p.id_filme,TRUE
FROM mostra_programacao p
WHERE NOT EXISTS (SELECT 1 FROM ofertas_filmes_unidade o WHERE o.id_local=p.id_local AND o.id_filme=p.id_filme);

INSERT INTO sessoes (id_filme,id_sala,data,horario_inicio,horario_fim,idioma,preco_inteira,status,custo_local_dia,custo_exibicao)
SELECT id_filme,id_sala,dia,inicio,fim,'LEGENDADO',preco,'AGENDADA',80.00,120.00
FROM mostra_programacao ORDER BY dia,inicio,id_sala;

INSERT INTO pedidos (id_usuario,status,valor_total,checkout_key,checkout_hash,checkout_expira_em)
SELECT @comprador,'PAGO',preco,chave,SHA2(chave,256),UTC_TIMESTAMP(3)+INTERVAL 15 MINUTE
FROM mostra_programacao;

CREATE TEMPORARY TABLE mostra_vendas AS
SELECT p.*,s.id_sessao,o.id_pedido,
       TIMESTAMP(DATE_ADD(p.dia,INTERVAL (p.fim<p.inicio) DAY),p.fim) AS expira_ingresso
FROM mostra_programacao p JOIN pedidos o ON o.id_usuario=@comprador AND o.checkout_key=p.chave
JOIN sessoes s ON s.id_sala=p.id_sala AND s.id_filme=p.id_filme AND s.data=p.dia AND s.horario_inicio=p.inicio;

INSERT INTO itens_pedido (id_pedido,id_sessao,id_assento,tipo_ingresso,quantidade,valor_unitario,subtotal)
SELECT id_pedido,id_sessao,id_assento,'INTEIRA',1,preco,preco FROM mostra_vendas;

INSERT INTO pagamento_intencoes (id_usuario,chave_idempotencia,id_pedido,id_metodo,valor,estado,provider,provider_ref,ultimo_evento_em)
SELECT @comprador,chave,id_pedido,@pix,preco,'CONCILIADA','SIMULATED',chave,UTC_TIMESTAMP(3)
FROM mostra_vendas;

INSERT INTO pagamentos (id_pedido,id_metodo,valor,status,data_pagamento,transacao_id,id_intencao)
SELECT v.id_pedido,@pix,v.preco,'APROVADO',UTC_TIMESTAMP(),v.chave,i.id_intencao
FROM mostra_vendas v JOIN pagamento_intencoes i ON i.id_pedido=v.id_pedido;

INSERT INTO assento_ocupacoes (id_sessao,id_assento,id_pedido,id_item,estado)
SELECT v.id_sessao,v.id_assento,v.id_pedido,i.id_item,'CONFIRMADA'
FROM mostra_vendas v JOIN itens_pedido i ON i.id_pedido=v.id_pedido;

INSERT INTO tickets (id_item,codigo,tipo,status,expira_em)
SELECT i.id_item,LOWER(HEX(RANDOM_BYTES(24))),'INGRESSO_SESSAO','GERADO',v.expira_ingresso
FROM mostra_vendas v JOIN itens_pedido i ON i.id_pedido=v.id_pedido;

SELECT 1 AS pagina,COUNT(*) AS sessoes_criadas,COUNT(*) AS ingressos_simulados
FROM mostra_vendas;
COMMIT;
