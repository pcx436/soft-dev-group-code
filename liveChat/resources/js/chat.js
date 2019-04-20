$(function () {
    var room; // represents the current room the user is in

    // establishes socket connection to the server while sending the username as the parameter
    console.log('UUID cookie: ' + Cookies.get('uid'));
    var socket = io({
        query: {
            uid: Cookies.get('uid')
        }
    });

    // makes string for adding elements to the chat log
    function buildMsg(data, clientSaid){
        var innerCount;

        // timestamp stuff
        var d = new Date();
        var h = d.getHours(), m = d.getMinutes(), side = "AM";
        if(h > 12){
            h -= 12;
            side = "PM";
        }
        var t = h.toString() + ":" + m.toString() + side;

        if(clientSaid){
            // client send message 
            innerCount =
            '<li class="right list-group-item clearfix">' +
                '<div class="chat-body clearfix">' +
                    '<div class="header">' +
                        '<small class="text-muted">' +
                            '<img class="widgetImg" src="resources/imgs/si-glyph-clock.svg" />' + t +
                        '</small>' +
                        '<strong class="float-right primary-font">' + data.name + '</strong>' +
                    '</div>' +
                    '<p class="card-text">' +
                        data.msg +
                    '</p>' +
                '</div>' +
            '</li>';
        }
        else{
            innerCount =
            '<li class="left list-group-item clearfix">' +
                '<div class="chat-body clearfix">' +
                    '<div class="header">' +
                        '<strong class="primary-font">' + data.name + '</strong>' +
                        '<small class="float-right text-muted">' +
                            '<img class="widgetImg" src="resources/imgs/si-glyph-clock.svg" />' + t +
                        '</small>' +
                    '</div>' +
                    '<p class="card-text">' +
                        data.msg +
                    '</p>' +
                '</div>' +
            '</li>';
        }
        return innerCount;
    }

    // sending chat message
    $('form').submit(function(e){
        e.preventDefault(); // prevents page reloading
        
        $('#messages').append(buildMsg({name:Cookies.get('user'), msg:$('#chat-input').val()}, true)); // add message to local chat log

        socket.emit('chat message', $('#chat-input').val()); // send message to all other room participants

        $('#chat-input').val(''); // clear input field
        
        return false; // not sure why this is here tbh, was in an example
    });

    // receiving message from other people
    socket.on('chat message', function(data){
        $('#messages').append(buildMsg(data, false)); // add to the message log
    });


    // changing server room functionality
    $(".room-btn").click(function(){
        var rname = $(this).text();// stores the name of the room

        // actually attempting to change rooms
        socket.emit('room join', room, rname, function(status){
            if(status === 0){
                console.log('Room change successful!');
                
                room = rname; // used for console logs, not very important

                $('#messages').html('');// wipe message log when changing rooms
            }
            else{
                console.log('Room change failed, status ' + status);
            }
        });
    });
});