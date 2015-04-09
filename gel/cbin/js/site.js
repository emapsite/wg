// Sub menu hover
$('#main_nav li.drop_menu').hover(function() {
	$(this).children('.drop_down').stop(true,true).fadeIn(200);
	$(this).find('span, span a').addClass('active');
	}, function () {
		$(this).children('.drop_down').stop(true,true).fadeOut(100);	
		$(this).find('span, span a').removeClass('active');
});
		
// Clear inputs on focus
$.fn.clearOnFocus = function(){
	return this.focus(function(){
	var v = $(this).val();
	$(this).val( v === this.defaultValue ? '' : v );
}).blur(function(){
	var v = $(this).val();
	$(this).val( v.match(/^\s+$|^$/) ? this.defaultValue : v );
	});
};

$('input[type=text]').clearOnFocus();