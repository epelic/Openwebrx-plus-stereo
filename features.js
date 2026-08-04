$(function(){
    var converter = new showdown.Converter({openLinksInNewWindow: true});

    function yes_no(v) {
        return v?
            '<td style="color:#00FF00;">YES</td>' :
            '<td style="color:#FF0000;">NO</td>';
    }

    $.ajax('api/features').done(function(data){
        var $table = $('table.features');
        $.each(data, function(name, details) {
            var requirements = $.map(details.requirements, function(r, name){
                return '<tr>' +
                           '<td style="padding-left:3em;">' + name + '</td>' +
                           '<td>' + converter.makeHtml(r.description) + '</td>' +
                           yes_no(r.available) +
                       '</tr>';
            });
            $table.append(
                '<tr>' +
                    '<td colspan=2><b>' + name + '</b></td>' +
                    yes_no(details.available) +
                '</tr>' +
                requirements.join("")
            );
        })
    });
});
