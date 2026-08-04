$.fn.clientList = function() {
    this.each(function() {
        $(this).on('click', '.client-ban', function(e) {
            var mins = $('#ban-minutes').val();
            $.ajax("/ban", {
                data: JSON.stringify({ ip: this.value, mins: mins }),
                contentType: 'application/json',
                method: 'POST'
            }).done(function() {
                document.location.reload();
            });
            return false;
        });

        $(this).on('click', '.client-unban', function(e) {
            $.ajax("/unban", {
                data: JSON.stringify({ ip: this.value }),
                contentType: 'application/json',
                method: 'POST'
            }).done(function() {
                document.location.reload();
            });
            return false;
        });
    });

    $('#broadcast-send').on('click', function(e) {
        var text = $('#broadcast-text').val();
        if (text.length > 0) {
            $.ajax("/broadcast", {
                data: JSON.stringify({ text: text }),
                contentType: 'application/json',
                method: 'POST'
            }).done(function() {
                $('#broadcast-text').val('');
            });
        }
        return false;
    });
}
