(function( window, document, $, undefined) {

  var tooltip

  // Append to list
  $( '#crew h3 img' )
    .live( 'mouseenter', function(){
      var $img = $( this )
        , pos  = $img.offset()

      tooltip = tooltip || $( '<img />', { 'class': 'ttImg' } ).appendTo( document.body )

      tooltip
        .hide()
        .load(function(){
          tooltip.css(
            { top : pos.top - ( tooltip.height() / 2 )
            , left: pos.left + 30
            })
          .fadeIn()
        })
        .attr( 'src', this.src )

      if ( $img[0].src == this.src )
        tooltip.trigger( 'load' )
    })
    .live( 'mouseleave', function(){
      tooltip.stop( true, true ).fadeOut()
    })

})( this, this.document, jQuery )
var request = function (options, callback) {
  options.success = function (obj) {
    callback(null, obj);
  }
  options.error = function (err) {
    if (err) callback(err);
    else callback(true);
  }
  if (options.data && typeof options.data == 'object') {
    options.data = JSON.stringify(options.data)
  }
  if (!options.dataType) options.processData = false;
  if (!options.dataType) options.contentType = 'application/json';
  if (!options.dataType) options.dataType = 'json';
  $.ajax(options)
}

$.expr[":"].exactly = function(obj, index, meta, stack){ 
  return ($(obj).text() == meta[3])
}

var param = function( a ) {
  // Query param builder from jQuery, had to copy out to remove conversion of spaces to +
  // This is important when converting datastructures to querystrings to send to CouchDB.
	var s = [];
	if ( jQuery.isArray(a) || a.jquery ) {
		jQuery.each( a, function() { add( this.name, this.value ); });		
	} else { 
	  for ( var prefix in a ) { buildParams( prefix, a[prefix] ); }
	}
  return s.join("&");
	function buildParams( prefix, obj ) {
		if ( jQuery.isArray(obj) ) {
			jQuery.each( obj, function( i, v ) {
				if (  /\[\]$/.test( prefix ) ) { add( prefix, v );
				} else { buildParams( prefix + "[" + ( typeof v === "object" || jQuery.isArray(v) ? i : "") +"]", v )}
			});				
		} else if (  obj != null && typeof obj === "object" ) {
			jQuery.each( obj, function( k, v ) { buildParams( prefix + "[" + k + "]", v ); });				
		} else { add( prefix, obj ); }
	}
	function add( key, value ) {
		value = jQuery.isFunction(value) ? value() : value;
		s[ s.length ] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
	}
}

function latestLinks(callback) {
	$.getJSON("/api/_design/app/_view/latestLinks?descending=true&limit=10", function(data){
		$.each(data.rows, function() {
			callback.call(this);
		});
	});
}

function users(callback) {
	$.getJSON("/api/_design/app/_view/users", function(data){
		$.each(data.rows, function() {
			callback.call(this);
		});
	});
}
function capitaliseFirstLetter(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}
var app = {};
app.index = function () {
	users(function() {
		var $user = $("#user").clone();
		$user.attr("id","");
		$user.get(0).id = "";
		$user.show();

		$user.find("h3 span.user").text(this.id);

		for(var i in this.value) {
			var value = this.value[i];
			if(!value || value ==="false") continue;
			if(i == "_id" || i == "_rev" || i == "type") continue;
			if(i == "avatar") {
				$user.find("h3 a").append("<img src='"+value+"' />");
			} else if(i == "location"){
				value = value + ' <a href="http://maps.google.com/maps?&amp;q='+value+'" title="Show it on a big map"><img src="http://maps.google.com/maps/api/staticmap?center='+value+'&amp;zoom=14&amp;size=175x175&amp;maptype=roadmap&amp;sensor=false" width="175" height="175"></a>';
				$user.find("ul").append('<li class="location">'+capitaliseFirstLetter(i)+': '+value+'</li>');
			} else {
				if(i == "twitter")
					value = "<a href='http://twitter.com/"+value+"'>"+value+"</a>";
				$user.find("ul").append('<li>'+capitaliseFirstLetter(i)+': '+value+'</li>');
			}

		}

		$("#crew").append($user);
	});
};

$(function () { 
  app.s = $.sammy(function () {
    // Index of all databases
    this.get('', app.index);
    this.get("#/", app.index);
  })
  app.s.run();
});
