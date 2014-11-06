var resetList = function (q, a) {
    $("#support-faqs > a").hide().removeClass("first");
    $("#support-faqs > div").removeClass("in").css("height", "");
    
    q.show().first().addClass("first");
    a.addClass("in");
};

$("#support-search").keystop(function () {
    var query = $.trim(this.value.toLowerCase());
    
    if (!query) {
        return resetList($("#support-faqs > a"), $());
    }
    
    var results = $("#support-faqs").children().filter(function () {
        return $(this).text().toLowerCase().indexOf(query) !== -1;
    });
    
    var q = results.filter("a");
    var a = results.filter("div");
    
    resetList(q.add(a.prev()), a.add(q.next()));
}, 250);

$("#support-buttons").on("click", "a", function () {
    $("#support-search").val("");
    
    resetList($("#support-faqs > a[data-target^='" + $(this).attr("href") + "']"), $());
    
    return false;
});