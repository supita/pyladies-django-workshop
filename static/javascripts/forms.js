(function ($, ux) {
    $( document ).ready(function() {

        // Protect against CSRF using a csrf_token
        // For more information: https://docs.djangoproject.com/en/dev/ref/csrf/
        var csrftoken = $.cookie('csrftoken');
        function csrfSafeMethod(method) {
          // these HTTP methods do not require CSRF protection
          return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
        }

        // Setup ajax 
        $.ajaxSetup({
          beforeSend: function(xhr, settings) {
              if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                  xhr.setRequestHeader("X-CSRFToken", csrftoken);
              }
          },
          dataType: 'json' // we expect JSON data back from the server
        });


        var actionButton = function ActionButton(options) {
                _.each($(options.selector), function( buttonElem ) { 

                var note = $(buttonElem).closest('.note-container');
                var noteID = note.attr('data-id');

                $(buttonElem).click( function () {
                    var that = this;
                    $.ajax({
                        url : options.get_url(noteID) || '',
                        method : options.method || 'GET',
                        success : function(data, textStatus) {
                            if (options.success) {
                                options.success(that, data, textStatus);
                            } else {
                                console.log(textStatus);
                                $.snackbar({content: data['message'] || 'Success.'});
                            }
                        },
                        data: options.get_data(that) || {},
                        error: function(data, textStatus ) {
                            if (options.error) {
                                options.error(that, data, textStatus);
                            } else {
                                console.log(textStatus);
                                $.snackbar({content: data['message'] || 'An error has occurred.'});
                            }
                        }
                    });
                });
            });
        };

        var deleteButton = actionButton({
            selector: 'button.delete',
            method: 'DELETE',
            get_url: function(noteID) {
                return '/api/v1/notes/' + noteID;
            },
            success: function(data, status) {
                var note = $(elem).closest('.note-container');
                ux.msnry.remove($(note));
                ux.msnry.layout();
            },
            error: function(elem, data, status ) {
              $.snackbar({content: 'Your note could not be deleted.' });
            }
        });

        var archiveButton = actionButton({
            selector: 'button.archive',
            method: 'POST',
            get_url: function(noteID) {
                return '/api/v1/notes/' + noteID;
            },
            get_data: function (elem) {
                return {'is_archived': !$(elem).hasClass('archived')}
            },
            success: function(elem, data, status) {
                var note = $(elem).closest('.note-container');
                ux.msnry.remove($(note));
                ux.msnry.layout();
                $.snackbar({content: 'Your note has been archived.' });

            },
            error: function(elem, data, status ) {
              $.snackbar({content: 'Your note could not be archived.' });
            }
        });

        var pinButton = actionButton({
            selector: 'button.pin',
            method: 'POST',
            get_url: function(noteID) {
                return '/api/v1/notes/' + noteID;
            },
            get_data: function (elem) {
                return {'is_pinned': !$(elem).hasClass('pinned')}
            },
            success: function(elem, data, status) {
                var note = $(elem).closest('.note-container');
                var is_pinned = !$(elem).hasClass('pinned');
                if (is_pinned) {
                    $(note).prependTo('#container');
                    $(note).find('span').removeClass('glyphicon-star-empty');
                    $(note).find('span').addClass('glyphicon-star');
                    // $.snackbar({content: 'Your note has been pinned.' });

                } else {
                    var lastUnpinnedNote = $('.note-container.pinned').last()[0] || $('.note-container').last();
                    $(note).insertAfter(lastUnpinnedNote);
                    $(note).find('span').removeClass('glyphicon-star');
                    $(note).find('span').addClass('glyphicon-star-empty');
                }
                $(elem).toggleClass('pinned');
                $(note).toggleClass('pinned');
                ux.msnry.reloadItems();
                ux.msnry.layout();
            },
            error: function(elem, data, status ) {
              $.snackbar({content: 'Your note could not be pinned.' });
            }
        });

        // Special code for edit button, I should really learn to code this more
        // efficiently

        _.each($('button.edit'), function( buttonElem ) { 
            var note = $(buttonElem).closest('.note-container');
            var noteID = note.attr('data-id');

            $(buttonElem).click( function () {
                BootstrapDialog.show({
                    title: 'Edit Note',
                    message: function(dialog) {
                        var $message = $('<div></div>');
                        var pageToLoad = dialog.getData('pageToLoad');
                        $message.load(pageToLoad);
                        return $message;
                    },
                    data: {
                        'pageToLoad': '/' +  noteID + '/edit'
                    },
                    backdrop: true,
                    buttons: [{
                        label: ' Update',
                        cssClass: 'btn-primary',
                        autospin: true,
                        action: function(dialogRef){
                            $.ajax({
                               type: "POST",
                               url: 'api/v1/notes/' + noteID,
                               data: $("#editForm").serialize(), // serializes the form's elements.
                               success: function(data)
                               {
                                // just because it's pretty, don't judge
                                setTimeout(function(){
                                   dialogRef.close(); 
                                   $.snackbar({content: 'Your note has been updated.' });
                                }, 1000);
                               },
                               error: function(data) {
                                   dialogRef.close(); 
                                   $.snackbar({content: 'Note could not be updated.' });
                               }
                            });
                        }
                    }, {
                        label: 'Close',
                        action: function(dialogRef){
                            dialogRef.close();
                        }
                    }]
                });
            });
        });


    });
})($, window.msnry);