$(function() {
  var modal = new MultiModal({
    title: 'Multi Modal',
    fullScreen: true
  });

  $(document).click(function(event) {
    if ($(event.target).hasClass('js-modal-close')) {
      modal.close();
    }

    if ($(event.target).hasClass('js-modal-close-all')) {
      modal.closeAll();
    }

    if ($(event.target).hasClass('js-toggle-modal')) {
      modal.new({
        content: 'Do you want to see the action?',
        buttons: {
          primary: {
            value: 'Yes!',
            className: 'button button--primary js-another-modal'
          },
          secondary: {
            value: 'No',
            className: 'button button--secondary',
            closeOnClick: true
          }
        }
      });
    } else if ($(event.target).hasClass('js-another-modal')) {
      modal.new({
        content: 'Just keep clicking',
        buttons: {
          primary: {
            value: 'Okay',
            className: 'button button--primary js-modalception'
          }
        }
      });
    } else if ($(event.target).hasClass('js-modalception')) {
      modal.new({
        title: 'Modalception!',
        content: 'Find out what happens in the end',
        buttons: {
          primary: {
            value: 'Find out!',
            className: 'button button--primary js-modalception'
          },
          secondary: {
            value: 'Close all',
            className: 'button button--secondary js-modal-close-all'
          }
        }
      });
    }
  });
});
