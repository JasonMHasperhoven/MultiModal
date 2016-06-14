interface ModalProps {
  isIEBrowser: boolean;
  remote?: string | RemoteProps;
  fullScreen?: boolean;
  allowBackdropClose?: boolean;
  title?: string;
  content?: string;
  closeButton?: boolean | string;
  className?: string;
  classList?: string[];
  buttons?: {
    primary: ModalButtonProps;
    secondary?: ModalButtonProps;
  };
}

interface RemoteProps {
  url: string;
  data: Object;
}

interface ModalButtonProps {
  value: string;
  href?: string;
  className?: string;
  classList?: string;
  closeOnClick?: boolean;
}

interface ModalObject {
  $wrapper: JQuery;
  $modal?: JQuery;
  allowBackdropClose?: boolean;
}

class Modal {
  protected HTMLModal: string;
  protected HTMLCloseButton: string;
  protected HTMLHeader: string;
  protected HTMLMain: string;
  protected HTMLActions: string;
  protected HTMLButtons: string;
  protected className: string = '';
  protected content: string;

  constructor(public props: ModalProps) {}

  public getJQueryElement(): JQuery {
    this.HTMLButtons     = this.renderButtons();
    this.HTMLActions     = this.renderActions();
    this.HTMLMain        = this.renderMain();
    this.HTMLHeader      = this.renderHeader();
    this.HTMLCloseButton = this.renderCloseButton();
    this.HTMLModal       = this.renderModal();

    if (this.props.fullScreen) {
      this.HTMLModal = this.renderFullScreenModal();
    }

    return $($.parseHTML(this.HTMLModal));
  }

  protected renderFullScreenModal(): string {
    return `<div class="modal__fullscreen">
      ${this.HTMLModal}
    </div>`;
  }

  protected renderModal(): string {
    this.className = this.parseClass(this.props);

    if (this.props.fullScreen) {
      if (this.props.isIEBrowser) {
        return `${this.HTMLCloseButton}
          <div class="modal--ie ${this.className} js-modal">
            ${this.HTMLHeader}
            ${this.HTMLMain}
          </div>`;
      } else {
        return `${this.HTMLCloseButton}
          <div class="multi-modal__table">
            <div class="multi-modal__table-cell">
              <div class="modal ${this.className} js-modal">
                ${this.HTMLHeader}
                ${this.HTMLMain}
              </div>
            </div>
          </div>`;
      }
    } else {
      if (this.props.isIEBrowser) {
        return `<div class="modal--ie ${this.className} js-modal">
          ${this.HTMLCloseButton}
          ${this.HTMLHeader}
          ${this.HTMLMain}
        </div>`;
      } else {
        return `<div class="multi-modal__table">
          <div class="multi-modal__table-cell">
            <div class="modal ${this.className} js-modal">
              ${this.HTMLCloseButton}
              ${this.HTMLHeader}
              ${this.HTMLMain}
            </div>
          </div>
        </div>`;
      }
    }
  }

  protected renderCloseButton(): string {
    let HTMLCloseButton = '';

    if (this.props.closeButton || this.props.fullScreen) {
      let className = '';

      if (this.props.closeButton === 'mobile') {
        className = 'modal__close--mobile';
      }

      if (this.props.fullScreen) {
        className = 'modal__close--fullscreen';
      }

      HTMLCloseButton = `<div class="modal__close ${className} js-modal-close">&times;</div>`;
    }

    return HTMLCloseButton;
  }

  protected renderHeader(): string {
    return `<div class="modal__header">
      ${this.props.title}
    </div>`;
  }

  protected renderMain(): string {
    if (this.props.content.substring(0, 1) == '<') {
      this.content = this.props.content;
    } else {
      this.content = `<p>
        ${this.props.content}
      </p>`;
    }

    return `<div class="modal__main">
      <div class="modal__content">
        ${this.content}
      </div>
      ${this.HTMLActions}
    </div>`;
  }

  protected renderActions(): string {
    return this.props.buttons ? `<div class="modal__actions">
      ${this.HTMLButtons}
    </div>` : '';
  }

  protected renderButtons(): string {
    let HTMLButtons: string = '';

    if (this.props.buttons) {
      Object.keys(this.props.buttons).forEach((key) => {
        let href: string = '';
        let className: string = `modal__button ${this.parseClass(this.props.buttons[key])}`;

        if (this.props.buttons[key].href) {
          href = `href="${this.props.buttons[key].href}"`;
        }

        if (this.props.buttons[key].closeOnClick) {
          className += ' js-modal-close';
        }

        HTMLButtons+= `<a role="button" ${href} class="${className}">
          ${this.props.buttons[key].value}
        </a>`;
      });
    }

    return HTMLButtons;
  }

  protected parseClass(props): string {
    let className = '';

    if (props.classList) {
      className += props.classList.join(' ');
    }

    if (props.className) {
      if (props.classList) {
        className += ' ';
      }

      className += props.className;
    }

    return className.trim();
  }
}

class MultiModal {
  protected $backdrop: JQuery;
  protected $close: JQuery;
  protected $wrapper: JQuery;
  protected modals: ModalObject[] = [];
  protected remote: RemoteProps = { url: '', data: {} };
  protected currentModal: number;
  protected isAnimating: boolean = false;

  constructor(public props: ModalProps) {
    this.props.isIEBrowser = this.getIEBrowser();

    if (!this.props.closeButton) {
      this.props.closeButton = 'mobile';
    }
  }

  public new(props: ModalProps): void {
    if (this.isAnimating) return;
    this.isAnimating = true;
    let mergedProps = $.extend(true, {}, this.props, props);

    if (!this.modals.length) {
      $(document.documentElement).css('overflow', 'hidden');
      $(document.body).append(this.renderMultiModal());

      this.$wrapper = $('.js-modal-wrapper');
      this.$backdrop = $('.js-modal-backdrop');
      this.$backdrop.click(() => this.onBackdropClick());
    }

    if (mergedProps.remote) {
      this.appendRemote(mergedProps);
    } else {
      this.appendModal(new Modal(mergedProps).getJQueryElement(), mergedProps);
    }
  }

  protected appendRemote(props: ModalProps): void {
    this.remote.url = <string>props.remote;
    this.remote.data = {};

    if (typeof props.remote === 'object') {
      this.remote.url = (<RemoteProps>props.remote).url;
      this.remote.data = (<RemoteProps>props.remote).data;
    }

    let request = $.get(this.remote.url, this.remote.data);

    request.done((HTMLRemote) => {
      let $remote = $($.parseHTML(`<div class="modal--remote js-modal">
        ${HTMLRemote}
      </div>`, null, true));

      this.appendModal($remote, props);
    });

    request.fail(function(http) {
      if (http.status === 404) {
        throw new Error(`MultiModal::FileNotFound: ${this.remote.url}`);
      } else if (http.status === 500) {
        throw new Error(`MultiModal::InternalServerError: ${this.remote.url}`);
      }
    });
  }

  protected appendModal($element: JQuery, props: ModalProps): void {
    this.modals.push({
      $wrapper: $element,
      allowBackdropClose: typeof props.allowBackdropClose === 'boolean' ? props.allowBackdropClose : true
    });
    this.currentModal = this.modals.length - 1;

    this.$wrapper.append(this.modals[this.currentModal].$wrapper);
    this.modals[this.currentModal].$modal = $('.js-modal').last();

    if (props.isIEBrowser || props.remote) {
      this.centerModal();
    }

    let Timeline: TimelineLite = new TimelineLite({
      onComplete: () => { this.isAnimating = false }
    });
    this.animateInNewModal(Timeline);
    this.animateInOtherModals(Timeline);
    this.fadeInBackdrop();

    if (props.fullScreen) {
      this.fadeInFullscreen();
    }
  }

  public close(): void {
    if (this.isAnimating) return;
    this.isAnimating = true;

    if (this.modals.length == 1) {
      this.$backdrop.removeClass('is-active');
    }

    let Timeline: TimelineLite = new TimelineLite({
      onComplete: () => this.onCloseComplete()
    });

    this.animateOutCurrentModal(Timeline);
    this.animateOutOtherModals(Timeline);
  }

  public closeAll(): void {
    this.$backdrop.removeClass('is-active');
    let Timeline = new TimelineLite({
      onComplete: () => this.onCloseAllComplete()
    });
    this.animateOutAllModals(Timeline);
  }

  protected onBackdropClick(): void {
    if (this.modals[this.currentModal].allowBackdropClose) {
      this.close();
    }
  }

  protected renderMultiModal(): string {
    return `<div class="multi-modal__wrapper js-modal-wrapper">
      <div class="multi-modal__backdrop js-modal-backdrop"></div>
    </div>`;
  }

  protected getIEBrowser(): boolean {
    let ua = window.navigator.userAgent;
    let msIE = ~ua.indexOf('MSIE ') || ~ua.indexOf('Trident/');
    return !!msIE;
  }

  protected animateInNewModal(Timeline: TimelineLite): void {
    Timeline.set(this.modals[this.currentModal].$modal, {
      display: 'block',
      opacity: 0,
      scale: .5
    }).to(this.modals[this.currentModal].$modal, .5, {
      opacity: 1,
      scale: 1,
      ease: Power4.easeInOut
    }, 'in');
  }

  protected animateInOtherModals(Timeline: TimelineLite): void {
    if (this.modals.length > 1) {
      if (this.props.fullScreen) {
        Timeline.to(this.modals[this.currentModal - 1].$modal, .5, {
          scale: '-=.15',
          opacity: 0,
          ease: Power4.easeInOut
        }, 'in');
      } else {
        for (let i in this.modals) {
          if (!(parseInt(i) === this.currentModal || parseInt(i) < (this.currentModal - 4))) {
            Timeline.to(this.modals[i].$modal, .5, {
              y: '-=24',
              scale: '-=.15',
              opacity: '-=.25',
              ease: Power4.easeInOut
            }, 'in');
          }
        }
      }
    }
  }

  protected fadeInBackdrop(): void {
    this.$backdrop.addClass('is-active');
  }

  protected fadeInFullscreen(): void {
    this.modals[this.currentModal].$wrapper.addClass('is-visible');
  }

  protected centerModal(): void {
    this.modals[this.currentModal].$modal.css({
      position: 'absolute',
      left: '50%',
      top: '50%',
      marginTop: -(this.modals[this.currentModal].$modal.height() / 2),
      marginLeft: -(this.modals[this.currentModal].$modal.width() / 2)
    });
  }

  protected animateOutCurrentModal(Timeline: TimelineLite): void {
    Timeline.to(this.modals[this.currentModal].$modal, .32, {
      opacity: 0,
      scale: .5,
      ease: Power4.easeInOut
    }, 'out');

    if (this.props.fullScreen) {
      this.modals[this.currentModal].$wrapper.removeClass('is-visible');
    }
  }

  protected animateOutOtherModals(Timeline: TimelineLite): void {
    if (this.modals.length > 1) {
      if (this.props.fullScreen) {
        Timeline.to(this.modals[this.currentModal - 1].$modal, .5, {
          scale: '+=.15',
          opacity: 1,
          ease: Power4.easeInOut
        }, 'out');
      } else {
        for (let i in this.modals) {
          if (!(parseInt(i) === this.currentModal || parseInt(i) < (this.currentModal - 4))) {
            Timeline.to(this.modals[i].$modal, .5, {
              y: '+=24',
              scale: '+=.15',
              opacity: '+=.25',
              ease: Power4.easeInOut
            }, 'out');
          }
        }
      }
    }
  }

  protected animateOutAllModals(Timeline: TimelineLite): void {
    for (let i in this.modals) {
      if (parseInt(i) > (this.currentModal - 4)) {
        Timeline.to(this.modals[i].$modal, .5, {
          opacity: 0,
          scale: '-=.5',
          ease: Power4.easeInOut
        }, 'out');
      }
    }

    if (this.props.fullScreen) {
      for (let i in this.modals) {
        this.modals[i].$wrapper.removeClass('is-visible');
      }
    }
  }

  protected onCloseComplete(): void {
    if (this.props.isIEBrowser) {
      this.modals[this.currentModal].$modal.remove();
    } else {
      this.modals[this.currentModal].$wrapper.remove();
    }

    this.modals.splice(this.currentModal, 1);
    this.currentModal = this.currentModal - 1;

    if (!this.modals.length) {
      $(document.documentElement).css('overflow', '');
      this.$wrapper.remove();
    }

    this.isAnimating = false;
  }

  protected onCloseAllComplete(): void {
    if (this.props.isIEBrowser) {
      $('.js-modal').remove();
    } else {
      $('.js-modal-wrapper').remove();
    }

    this.modals = [];
    this.currentModal = -1;
    $(document.documentElement).css('overflow', '');
    this.$wrapper.remove();

    this.isAnimating = false;
  }
}
