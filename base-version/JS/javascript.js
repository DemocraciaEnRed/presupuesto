window.DEFAULT_COLOR = 'rgba(255,255,255,.0)';
$(document).ready(function(e) {
	
	$.get('/api/budget/2015', function (data) {
		var i = -1;
		window.categoriasGobierno2015 = data.map(function(budget) {
			i++;
			return {
				codigo: i,
				nombre: budget.category.name,
				color: DEFAULT_COLOR,
				presupuesto: budget.amount,
				imagen: budget.category.image
			}
		})

		$.get('/api/budget/average', function (data) {
			var i = -1;
			window.categoriasAverage = data.map(function(budget) {
				i++;
				return {
					codigo: i,
					nombre: budget.category.name,
					color: DEFAULT_COLOR,
					presupuesto: budget.amount,
					imagen: budget.category.image
				}
			})
			//Decidir que hacer en base al hash de la url y la cookie
			var hash = document.location.href.split('#')[1];
			var cookie = document.cookie['mybudget'];
			if(hash)
			{
				if(cookie)
				{
					if(hash == cookie)
					{
						//TODO: Cargar el budget del identificador del hash y permitir edicición
					}
					else
					{
						//TODO: Cargar el budget del identificador del hash y NO permitir edicición,
						//con la opción para que edite el que ya creó (cargando el budget del identificador de la cookie)
					}
				}
				else
				{
					//TODO: Cargar el budget del identificador del hash y NO permitir edicición, con la opción de que cree uno nuevo
				}
			}
			else if(cookie)
			{
				//TODO: Cargar el budget del identificador de la cookie y permitir edicición
			}
			else
				CargarInicio();
		});
	});
});

function CargarInicio()
{
	var sky = CrearElemento('div', 'street-section-sky');
	$('#inicio').append(sky);
		$(sky).append(CrearElemento('div', 'rear-clouds'));
		$(sky).append(CrearElemento('div', 'front-clouds'));

	var	titulo = CrearElemento('div', 'title');
	$(titulo).html('Armá tu ciudad');
	$('#inicio').append(titulo);

	var	subTitulo = CrearElemento('div', 'subTitle');
	$(subTitulo).html('Hacé como si fueras un/a legislador/a y designá el porcentaje del presupuesto que querés destinar a cada área </br> ¿Qué considerás prioritario? ¿Qué deseás mejorar?');
	$('#inicio').append(subTitulo);
	
	var iniciarJuego = CrearElemento('div', 'buttonIniciarJuego');
	$(iniciarJuego).html('Comenzar');
	$(iniciarJuego).click(function(e) {
		CargaJuego(categoriasDefault);
    });
	$('#inicio').append(iniciarJuego);
}

function CargaJuego(_data)
{
	var data = $.extend(true, [], _data);
	
	CargarData('#juego', data, false);

	var terminarJuego = CrearElemento('div', 'finishButton');
	$(terminarJuego).html('Terminar');
	$(terminarJuego).click(function(e) {
		CargarResultados(data);
		
		//Guardar resultado en base de datos
		GuardarData(data, function (respuesta)
		{
			if (respuesta.status === 200)
			{
				var texto = respuesta.responseText;
				var cookieName = 'mybudget';
				var expireDate = new Date();
				expireDate.setDate(expireDate.getDate() + 365);
				//Crear cookie con un identificador del resultado
				document.cookie = cookieName + '=' + texto + ';max-age=' + 60*60*24*365 + ';expires=' + expireDate.toGMTString();
				//Agregar el identificador en la url
				SetURL(texto);
			}
		});
    });
	$('.header').append(terminarJuego);
	
	var dineroTotal = CrearElemento('div','total-dinero');
	$(dineroTotal).html('Presupuesto Total: '+FormateoDinero(window.presupuestoTotal));
	$('#juego').append(dineroTotal);

	//Interaccion
	$('.item-container:first').resizable({
		handles: "e",
		autoHide: true,
		resize: function( event, ui ) {
			var presupuesto = (ui.size.width + 2) / window.anchoTotal * window.presupuestoTotal;
			$(ui.element).children('.textDataContainer').children('.presupuestoCategoria').html(FormateoDinero(presupuesto));

			dif = ui.originalSize.width - ui.element.outerWidth(true);
			siguientes = $('.ui-resizable-resizing').nextAll().filter(function(index, e){ return ( dif > 0 || (dif < 0 && $(e).outerWidth(true) > 12)) });
			var sumaCategoria = (dif+2) / siguientes.length;
			siguientes.each(function(index, element) {
				var anchoCategoria = parseFloat($(element).attr('data-presupuesto')) / window.presupuestoTotal * window.anchoTotal + sumaCategoria;
				var presupuesto = anchoCategoria / window.anchoTotal * window.presupuestoTotal;
				$(this).children('.textDataContainer').children('.presupuestoCategoria').html(FormateoDinero(presupuesto));
				$(element).css('width', anchoCategoria + 'px');
            });
			ui.element.css('width', ui.size.width + 'px');
		},
		stop: function(event, ui)
		{
			$(data).each(function(index, element) {
				RecalcularPresupuesto(element);
            });
		}
	});
	$('.item-container:not(:first):not(:last)').resizable({
		handles: "w,e",
		autoHide: true,
		resize: function( event, ui ) {
			var direction = 'left';
			var dif = ui.position.left - ui.originalPosition.left;
			var siguientes = $('.ui-resizable-resizing').prevAll().filter(function(index, e){ return ( dif > 0 || (dif < 0 && $(e).outerWidth(true) > 0)) });
			if(dif == 0)
			{
				direction = 'right';
				dif = ui.originalSize.width - ui.size.width;
				siguientes = $('.ui-resizable-resizing').nextAll().filter(function(index, e){ return ( dif > 0 || (dif < 0 && $(e).outerWidth(true) > 0)) });
			}
			var sumaCategoria = (dif+2) / siguientes.length;

			var presupuesto = (ui.size.width + 2) / window.anchoTotal * window.presupuestoTotal;
			$(ui.element).children('.textDataContainer').children('.presupuestoCategoria').html(FormateoDinero(presupuesto));

			siguientes.each(function(index, element) {
				var anchoCategoria = parseFloat($(element).attr('data-presupuesto')) / window.presupuestoTotal * window.anchoTotal + sumaCategoria;
				$(element).css('width', anchoCategoria + 'px');
				
				var presupuesto = anchoCategoria / window.anchoTotal * window.presupuestoTotal;
				$(this).children('.textDataContainer').children('.presupuestoCategoria').html(FormateoDinero(presupuesto));
            });
			
			if(direction == 'right')
				ui.element.css('width', ui.size.width + 'px');
			else
			{
				ui.element.css('margin-left', -dif + 'px');
				ui.element.css('margin-right', dif + 'px');
			}
		},
		stop: function(event, ui)
		{
			ui.element.css('left', ui.position.left + SinPx(ui.element.css('margin-left')));
			ui.element.css('margin-left', 0 + 'px');
			ui.element.css('margin-right', 0 + 'px');
			$(data).each(function(index, element) {
				RecalcularPresupuesto(element);
            });
		}
	});
	$('.item-container:last').resizable({
		handles: "w",
		autoHide: true,
		resize: function( event, ui ) {
			var dif = ui.position.left - ui.originalPosition.left;
			var siguientes = $('.ui-resizable-resizing').prevAll().filter(function(index, e){ return ( dif > 0 || (dif < 0 && $(e).outerWidth(true) > 12)) });
			var sumaCategoria = (dif+2) / siguientes.length;

			var presupuesto = (ui.size.width + 2) / window.anchoTotal * window.presupuestoTotal;
			$(ui.element).children('.textDataContainer').children('.presupuestoCategoria').html(FormateoDinero(presupuesto));

			siguientes.each(function(index, element) {
				var anchoCategoria = parseFloat($(element).attr('data-presupuesto')) / window.presupuestoTotal * window.anchoTotal + sumaCategoria;
				$(element).css('width', anchoCategoria + 'px');
				
				var presupuesto = anchoCategoria / window.anchoTotal * window.presupuestoTotal;
				$(this).children('.textDataContainer').children('.presupuestoCategoria').html(FormateoDinero(presupuesto));
            });
			ui.element.css('margin-left', -dif + 'px');
			ui.element.css('margin-right', dif + 'px');
		},
		stop: function(event, ui)
		{
			ui.element.css('left', ui.position.left + SinPx(ui.element.css('margin-left')));
			ui.element.css('margin-left', 0 + 'px');
			ui.element.css('margin-right', 0 + 'px');
			$(data).each(function(index, element) {
				RecalcularPresupuesto(element);
            });
		}
	});
	
	//Desplazamiento hacia el contenedor del juego
	$('.container-wrapper').animate({top: '-100%'}, 1000, function()
		{
			setTimeout(function(){
				$('.item-container').css('border-color', 'rgba(0,0,0,.1)');
				$('.header').animate({top:0}, 500, function(){
					$(dineroTotal).slideDown('fast');
				});
			}, 200);
		}
	);
}

function CargarResultados(data)
{
	$('.finishButton').animate({opacity:0}, 500, function(){
		$('.finishButton').remove();
	});
	
	var	contenedor1 = CrearElemento('div', 'inset-container');
	$('#resultados').append(CrearElemento('div', 'wrapper-half-height').append(contenedor1));
		$(contenedor1).append(CrearElemento('div','wrapper'));

		var wrapper1 = CrearElemento('div','wrapper-bottom');
		$(contenedor1).append(wrapper1);

			var titulo1 = CrearElemento('div','headerName');
			$(titulo1).html('Tu ciudad');
			$(wrapper1).append(titulo1);
	
			var shareFacebook = CrearElemento('div','shareButtonFacebook');
			$(shareFacebook).html('Compartila en Facebook');
			$(shareFacebook).click(function(e) {
                ShareButtonFacebook(window.location.href, 'Así armé el presupuesto para la ciudad', 'Armá el tuyo en armatuciudad.com.ar', location.origin+location.pathname+'IMG/shareImage.png');
            });
			$(wrapper1).append(shareFacebook);
	
			var shareTwitter = CrearElemento('div','shareButtonTwitter');
			$(shareTwitter).html('Compartila en Twitter');
			$(shareTwitter).click(function(e) {
                ShareButtonTwitter(window.location.href, 'Así armé el presupuesto para la ciudad ');
            });
			$(wrapper1).append(shareTwitter);

	var	contenedor2 = CrearElemento('div', 'inset-container');
	$('#resultados').append(CrearElemento('div', 'wrapper-half-height').append(contenedor2));
		$(contenedor2).append(CrearElemento('div','wrapper'));
		
		var wrapper2 = CrearElemento('div','wrapper-bottom');
		$(contenedor2).append(wrapper2);

			var botonTitulo2Hoy = CrearElemento('div','headerName button selected');
			$(botonTitulo2Hoy).html('Buenos Aires hoy');
			$(botonTitulo2Hoy).click(function(e) {
                CargarData(contenedor2.children()[0], categoriasGobierno2015, true);
				$('.selected').removeClass('selected');
				$(this).addClass('selected');
            });
			$(wrapper2).append(botonTitulo2Hoy);
			
			var botonTitulo2Promedio = CrearElemento('div','headerName button');
			$(botonTitulo2Promedio).html('Presupuesto ciudadano');
			$(botonTitulo2Promedio).click(function(e) {
                CargarData(contenedor2.children()[0], window.categoriasAverage, true);
				$('.selected').removeClass('selected');
				$(this).addClass('selected');
            });
			$(wrapper2).append(botonTitulo2Promedio);
		

	CargarData(contenedor1.children()[0], data, true);
	CargarData(contenedor2.children()[0], categoriasGobierno2015, true);

	var base = CrearElemento('div', 'items-base');
	$('#resultados').append(base);

	var masInfo = CrearElemento('div', 'buttonIniciarJuego');
	$(masInfo).html('Más información');
	$(masInfo).click(function(e) {
		CargarMasInfo();
	});
	$('#resultados').append(masInfo);

	$('.container-wrapper').animate({top: '-200%'}, 1000, function()
		{
			setTimeout(function(){
				var i = 1;
				$('.inset-container').each(function(index, element) {
					setTimeout(function(){
						$(element).animate({opacity:1}, 700);
					}, i * 100);
					i++;
                });
			}, 100);
		}
	);
}

function CargarMasInfo()
{
	// Información
	var info = {
		titulo: '¿Cómo se formula el presupuesto porteño?',
		descripcion: 'Cada año, a partir de un proyecto que envía el Jefe de gobierno, la Legislatura porteña sanciona la ley de Presupuesto de la ciudad, que estipula la distribución de los fondos para cada área de gobierno.<br />Las prioridades de gestión de gobierno, así como el mantenimiento del estado, se deciden en el presupuesto.'
	};

	//Cargar información en #datos
	var $datos = $('#datos');

	var $titulo = $(CrearElemento('div', 'title'));
	$titulo.html(info.titulo);

	var $descripcion = $(CrearElemento('div', 'subTitle'));
	$descripcion.html(info.descripcion);

	var $volverInicio = $(CrearElemento('div', 'buttonIniciarJuego'));
	$volverInicio.html('Volver a armar');
	$volverInicio.click(function(e) {
		// vaciamos el contenido de #juego
		$('#juego').html('');
		// y volvemos a ejecutar CargaJuego
		CargaJuego(categoriasDefault);

		// esperamos que termine de subír y borramos los resultados
		// y los datos
		setTimeout(function ()
		{
			$('#resultados').html('');
			$datos.html('');
		}, 1000)
	});

	$datos.append($titulo);
	$datos.append($descripcion);
	$datos.append($volverInicio);

	//Desplazamiento hacia el contenedor de más info
	$('.container-wrapper').animate({top: '-300%'}, 1000, function()
		{
			setTimeout(function(){
				$('.item-container').css('border-color', 'rgba(0,0,0,.1)');
				$('.header').animate({top:'-100%'}, 500);
			}, 200);
		}
	);
}

function CargarData(contenedor, data, porcentaje)
{
	//Borro el contenido del contenedor
	$(contenedor).html('');
	
	//Creación del cielo, calle base y contenedor de categorias
	var sky = CrearElemento('div', 'street-section-sky');
	$(contenedor).append(sky);
		$(sky).append(CrearElemento('div', 'rear-clouds'));
		$(sky).append(CrearElemento('div', 'front-clouds'));
	var base = CrearElemento('div', 'items-base');
	$(contenedor).append(base);
	var itemsContainer = CrearElemento('div', 'items-container');
	$(contenedor).append(itemsContainer);
	
	//Calculo de presupuestoTotal en base a la suma de los presupuestos de todas las categoiras
	window.presupuestoTotal = 0;
	data.forEach(function(cat){window.presupuestoTotal += cat.presupuesto;});
	
	window.anchoTotal = $(itemsContainer).outerWidth(true);
	
	//Carga de cada categoria en el contenedor con un ancho relativo a su presupuesto
	var porcentajePromedio = 100 / data.length;
	var leftAcumulador = 0;
	data.sort(function(a, b){ return a.codigo - b.codigo }).forEach(function(cat)
	{
		var anchoCategoria = cat.presupuesto / window.presupuestoTotal * window.anchoTotal;

		var itemCategoria = document.createElement('div');
		$(itemCategoria).addClass('item-container');
		$(itemCategoria).attr('id', 'panelCategoria'+cat.codigo);
		$(itemCategoria).attr('data-codigo', cat.codigo);
		$(itemCategoria).attr('data-presupuesto', cat.presupuesto);
		$(itemCategoria).css('width', Math.floor(anchoCategoria)+'px');
		$(itemsContainer).append(itemCategoria);
		
		var dataContainer = document.createElement('div');
		$(dataContainer).addClass('dataContainer');
		$(dataContainer).css('background-color', cat.color);
		$(itemCategoria).append(dataContainer);
		
		var textContainer = CrearElemento('div', 'textDataContainer');
		$(itemCategoria).append(textContainer);
		
		var nombreCategoria = document.createElement('div');
		$(nombreCategoria).addClass('nombreCategoria');
		$(nombreCategoria).html(cat.nombre);
		$(nombreCategoria).attr('title', cat.nombre);
		$(textContainer).append(nombreCategoria);

		if(porcentaje)
		{
			var porcentajeCategoria = CrearElemento('div', 'porcentajeCategoria');
			var dif = Math.round((cat.presupuesto * 100 / presupuestoTotal) * 100) / 100;
			$(porcentajeCategoria).html(dif+'%');
			$(textContainer).append(porcentajeCategoria);
		}

		var presupuestoCategoria = document.createElement('div');
		$(presupuestoCategoria).addClass('presupuestoCategoria');
		$(presupuestoCategoria).html(FormateoDinero(cat.presupuesto));
		$(textContainer).append(presupuestoCategoria);
		
		var imagenesCategoriaContainer = document.createElement('div');
		$(imagenesCategoriaContainer).addClass('imagenesCategoriaContainer');
		$(dataContainer).append(imagenesCategoriaContainer);

		if(cat.info)
		{
			var infoCategoriaContainer = document.createElement('div');
			$(infoCategoriaContainer).addClass('infoCategoriaContainer');
			$(infoCategoriaContainer).html(cat.info);
			$(textContainer).append(infoCategoriaContainer);
		}
		
		var imagenCategoria = document.createElement('div');
		$(imagenCategoria).addClass('imagenCategoria');
		$(imagenCategoria).css('background-image', 'url(IMG/categorias/'+cat.imagen+')');
		$(imagenesCategoriaContainer).append(imagenCategoria);
	});
}

function RecalcularPresupuesto(element)
{
	var e = $('.item-container[data-codigo="'+element.codigo+'"]');
	var ancho = e.outerWidth(true);
	element.presupuesto = ancho / window.anchoTotal * window.presupuestoTotal;
	$(e).children('.presupuestoCategoria').html(FormateoDinero(element.presupuesto));
	$(e).attr('data-presupuesto', element.presupuesto);
}

function SinPx(string)
{
	return parseInt(string.split('px')[0]);
}

function SinPorcentaje(string)
{
	return parseInt(string.split('%')[0]);
}

function Porcentaje(valor, total)
{
	return valor / total * 100;
}

function FormateoDinero(num)
{
	var str = (num/1000000).toFixed(2).toString().split('.');
    if (str[0].length >= 4) {
        str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1.');
    }
    return '$' + str.join(',') + ' M';
}

function CrearElemento(tag, className)
{
	var presupuestoCategoria = document.createElement(tag);
	$(presupuestoCategoria).addClass(className);
	return $(presupuestoCategoria);
}

function SetURL(id)
{
	var title = 'Armá tu ciudad - ciudad ' + id;
	var url = window.location.origin + location.pathname + '#' + id;
    if (typeof (history.pushState) != "undefined") 
	{
		document.title = title;
        var obj = { Title: title, Url: url };
        history.pushState(obj, obj.Title, obj.Url);
    }
	//TODO: crear evento de analytics
}

function ShareButtonTwitter(url, message)
{
	window.open('https://twitter.com/intent/tweet?'+
	'related=PartidodelaRed&'+
	'text='+ encodeURIComponent(message + url + ' #ArmaTuCiudad en ' + location.origin+location.pathname),
	'Compartí en Twitter', 'width=900,height=300,menubar=no,status=no,titlebar=no,top=200,left='+(screen.width-900)/2);
}

function ShareButtonFacebook(url, title, message, image)
{
	window.open('http://www.facebook.com/dialog/feed?app_id=1008540162492210' +
	'&link='+encodeURIComponent(url) +
	'&picture=' + encodeURIComponent(image) +
	'&name=' + encodeURIComponent(title) +
	'&caption=' + 'via armatuciudad.com.ar - Partido de la Red' +
	'&description=' + encodeURIComponent(message) +
	'&redirect_uri=' + location.origin+location.pathname+'close.html' +
	'&display=popup'
	, 'Compartí en Facebook', 'width=900,height=300,menubar=no,status=no,titlebar=no,top=200,left='+(screen.width-900)/2);
}

function GuardarData(data, cb)
{
	$.ajax({
		type: 'POST',
		url: '/api/mybudget/',
		data: { data: data },
		dataType: 'json'
	}).always(cb);
}