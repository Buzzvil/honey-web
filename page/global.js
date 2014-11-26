///////////////////////////////////////////////////////////////////////////////
// Global
///////////////////////////////////////////////////////////////////////////////
$(".carousel").carousel({
    interval: 3000,
    pause: false,
    keyboard: false
});

$(".carousel").parent().click(function () {
    $(this).find(".carousel").carousel("next");
});


///////////////////////////////////////////////////////////////////////////////
// Page: Support
///////////////////////////////////////////////////////////////////////////////
var supportReset = function (q, a) {
    $("#support-faqs > :even").hide().removeClass("first-child");
    $("#support-faqs > :odd").removeClass("in").css("height", "");
    
    q.show().first().addClass("first-child");
    a.addClass("in");
};

$("#support-search").keystop(function () {
    if (!$(this).data("listen")) {
        return $(this).data("listen", true);
    }
    
    var query = $.trim(this.value.toLowerCase());
    
    if (!query) {
        return supportReset($("#support-faqs > :even"), $());
    }
    
    var results = $("#support-faqs").children().filter(function () {
        return $(this).text().toLowerCase().indexOf(query) !== -1;
    });
    
    var q = results.filter(":even");
    var a = results.filter(":odd");
    
    supportReset(q.add(a.prev()), a.add(q.next()));
}, 250).data("listen", true);

$("#support-buttons").on("click", "a", function () {
    $("#support-search").data("listen", false).val("").trigger("input");
    
    supportReset($("#support-faqs [data-target^='" + $(this).attr("href") + "']").parent(), $());
    
    return false;
});