(function( window, document, $, undefined) {

  var tooltip

  // Append to list
  $( '.content .crew_card h3 img' )
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
function linksByUser(user, callback) {
	$.getJSON("/api/_design/app/_view/linksByUser?key=\""+user+"\"", function(data){
		$.each(data.rows, function(idx) {
			callback.apply(this, [data.rows.length]);
		});
	});
}
function capitaliseFirstLetter(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}
function escapeHtml(t) {
	return $('<div/>').text(t).html();
}
function replaceURLWithHTMLLinks(text) {
		var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
		return text.replace(exp,"<a target='_blank' href='$1'>$1</a>"); 
}
function replaceContent(template) {
    var c = $(".content").html($(template).html());
    return c;
}
var app = {};
app.index = function () {
    var content = replaceContent(".crew_template");
	users(function() {
		var $user = content.find(".crew_user:first-child").clone();
		$user.show();

		$user.find("h3 a.user")
                .attr("href", "#/"+this.id)
                .text(this.id);

		var props = [];
		for(var i in this.value)	
			props.push(i);

		props = props.sort();

		for(var x=0; x<props.length; x++) {
			var i = props[x];
			var value = this.value[i];
			value = escapeHtml(value);
			i = escapeHtml(i);
            i = i.toLowerCase();
            if(i == "active" && value === "false") return; // returning here, we want users to turn off their card
			if(i == "_id" || i == "_rev" || i == "type" || i == "active") continue;
			if(!value || value ==="false") continue;
			if(i == "avatar") {
				$user.find("h3 a:first-child")
                    .attr("href", "#/"+this.id)
                    .append("<img src='"+value+"' />");
			} else if(i == "location"){
				value = value + ' <a href="http://maps.google.com/maps?&amp;q='+value+'" title="Show it on a big map"><img src="http://maps.google.com/maps/api/staticmap?center='+value+'&amp;zoom=14&amp;size=175x175&amp;maptype=roadmap&amp;sensor=false" width="175" height="175"></a>';
				$user.find("ul").append('<li class="location">'+capitaliseFirstLetter(i)+': '+value+'</li>');
			} else {
				value = replaceURLWithHTMLLinks(value);
				if(i == "twitter")
					value = "<a href='http://twitter.com/"+value+"'>"+value+"</a>";
                else if (i == "github")
					value = "<a href='https://github.com/"+value+"'>"+value+"</a>";
				$user.find("ul").append('<li>'+capitaliseFirstLetter(i)+': '+value+'</li>');
			}

		}

		content.find(".crew_card").append($user);
	});

    /*
    latestLinks(function() {
        var that = this;
        $.getJSON("http://clients1.google.com/webpagethumbnail?r=4&f=3&s=400:585&query="+that.value.link+"&hl=en&gl=us&c=29&d="+encodeURIComponent(that.value.link)+"%2F&b=1&j=?&a=8EH", function(data) {
            var thumb = data.shards[0].imgs[0];
            //$("links").append("<a href='"+this.value.link+"'>"+this.value.link+"</a> by "+this.value.user+"<br>");
            $("links").append("<p><a href='"+that.value.link+"'><img src='"+thumb+"' /></a><br>by "+that.value.user+"</p>");
        });
    });
    */
};

app.user = function(context) {
    var content = replaceContent(".user_template");
    var user = this.params['user'];
    content.find("h1").text(user);

    var loading = $(".loading");
    loading.show();
    var opts = {
      lines: 12, // The number of lines to draw
      length: 7, // The length of each line
      width: 4, // The line thickness
      radius: 10, // The radius of the inner circle
      color: '#7A7A7A', // #rgb or #rrggbb
      speed: 1, // Rounds per second
      trail: 60, // Afterglow percentage
      shadow: false // Whether to render a shadow
    };
    var target = loading.get(0);
    var spinner = new Spinner(opts).spin(target);

    function itsDone() {
        var imgContent = content.find(".user_links");
        // delete the first li
        var firstCard = content.find(".link_card:first-child");
        firstCard.remove();

        imgContent.masonry({
            itemSelector : '.link_card'
        });
        if(imgContent.children().length == 1) {
            imgContent.css("height", "auto");
            content.find(".user_links .last").before('<p class="no_images"><g>You haven\'t posted any images, <r>ASSHOLE</r><g></p>');
        }
        loading.hide();
        imgContent.css("visibility", "visible");
    }

    var itemsLoaded = 0;
    linksByUser(user, function(totItems){
        var link = this.value;
        var $card = content.find(".link_card:first-child").clone();
        $card.show();

        // load the img to see if it's an image
        var img = new Image();
        $(img)
            .load(function(){
                var a = $("<a href='"+link+"'></a>");
                a.append(this);
                $card.append(a);
                content.find(".user_links .last").before($card);
                itemsLoaded++;
                if(itemsLoaded == totItems)
                    itsDone();
            })
            .error(function(){
                itemsLoaded++;
                if(itemsLoaded == totItems)
                    itsDone();
            })
            .attr("src", link);
    });
};

$(function () { 
  app.s = $.sammy(function () {
    // Index of all databases
    this.get('', app.index);
    this.get("#/", app.index);
    this.get("#/:user", app.user);
  })
  app.s.run();
});
