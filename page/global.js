///////////////////////////////////////////////////////////////////////////////
// Scrollers
///////////////////////////////////////////////////////////////////////////////
$(".scroller").click(function () {
    document.activeElement.blur();
    
    $("html, body").animate({
        scrollTop: $($(this).attr("href")).offset().top
    }, 250);
    
    return false;
});


///////////////////////////////////////////////////////////////////////////////
// Carousels
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
// Maps
///////////////////////////////////////////////////////////////////////////////
$(".frame-map").one("click", function () {
    $(this).children().css("pointer-events", "auto");
}).children().css("pointer-events", "none");


///////////////////////////////////////////////////////////////////////////////
// Page: Support
///////////////////////////////////////////////////////////////////////////////
var $supportFAQs = $("#support-faqs").children();
var $supportQs = $supportFAQs.filter(":even");
var $supportAs = $supportFAQs.filter(":odd");

var supportReset = function (q, a) {
    $supportQs.hide().removeClass("first-child");
    $supportAs.removeClass("in").css("height", "");
    
    q.show().first().addClass("first-child");
    a.addClass("in");
};

$("#support-search").keypress(function (evt) {
    if (evt.which === 13) {
        $(".scroller").click();
    }
}).keystop(function () {
    if (!$(this).data("listen")) {
        return $(this).data("listen", true);
    }
    
    var query = $.trim(this.value.toLowerCase());
    
    if (!query) {
        return supportReset($supportQs, $());
    }
    
    var results = $supportFAQs.filter(function () {
        return $(this).text().toLowerCase().indexOf(query) !== -1;
    });
    
    var q = results.filter($supportQs);
    var a = results.filter($supportAs);
    
    supportReset(q.add(a.prev()), a.add(q.next()));
}, 250).data("listen", true);

$("#support-buttons").on("click", "a", function () {
    $("#support-search").data("listen", false).val("").trigger("input");
    
    supportReset($supportFAQs.find("[data-target^='" + $(this).attr("href") + "']").parent(), $());
    $(".scroller").click();
    
    return false;
});