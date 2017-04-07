$(document).ready(function(){
		
		$('#title').click(function(){
			console.log("<tr>" + $('#titleinput').val() + "</tr>");
			$('#titlelist').append("<tr><td>" + $('#titleinput').val() + "</td></tr>");
			
		});
		
		$("#titlelist").delegate('td','mouseover mouseleave', function(e) {
			if (e.type == 'mouseover') {
			  $(this).parent().addClass("highlight");
			  $("colgroup").eq($(this).index()).addClass("highlight");
			}
			else {
			  $(this).parent().removeClass("highlight");
			  $("colgroup").eq($(this).index()).removeClass("highlight");
			}
		});

		$("#urlbutton").click(function(){
			console.log($("#urlbox").val());
		});
		
		
		
		
		});