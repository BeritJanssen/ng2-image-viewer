import {AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, Renderer2, SimpleChanges} from '@angular/core';

declare var $: any;
declare var ImageViewer: any;

/**
 * @author Breno Prata - 22/12/2017
 */
@Component({

    selector: 'app-image-viewer',

    templateUrl: './image-viewer.component.html',

    styleUrls: ['./image-viewer.component.scss']
})
export class ImageViewerComponent implements OnChanges, OnInit, AfterViewInit {

    BASE_64_IMAGE = 'data:image/png;base64,';
    BASE_64_PNG = `${this.BASE_64_IMAGE} `;
    BASE_64_PDF = 'data:application/pdf;base64, ';
    ROTACAO_PADRAO_GRAUS = 90;
    TOTAL_ROTACAO_GRAUS_VERTICAL = this.ROTACAO_PADRAO_GRAUS * 3;

    @Input() idContainer;
    @Input() images: any[];
    @Input() rotate = true;
    @Input() download = true;
    @Input() fullscreen = true;
    @Input() resetZoom = true;
    @Input() loadOnInit = false;
    @Input() showOptions = true;
    @Input() zoomInButton = true;
    @Input() zoomOutButton = true;

    @Input() showPDFOnlyOption = true;
    @Input() primaryColor = '#0176bd';
    @Input() buttonsColor = 'white';
    @Input() buttonsHover = '#333333';
    @Input() defaultDownloadName = 'Image';
    @Input() rotateRightTooltipLabel = 'Rotate right';
    @Input() rotateLeftTooltipLabel = 'Rotate left';
    @Input() resetZoomTooltipLabel = 'Reset zoom';
    @Input() fullscreenTooltipLabel = 'Fullscreen';
    @Input() zoomInTooltipLabel = 'Zoom In';
    @Input() zoomOutTooltipLabel = 'Zoom Out';
    @Input() downloadTooltipLabel = 'Download';
    @Input() showPDFOnlyLabel = 'Show only PDF';
    @Input() openInNewTabTooltipLabel = 'Open in new tab';
    @Input() enableTooltip = true;

    @Output() onNext = new EventEmitter();
    @Output() onPrevious = new EventEmitter();

    viewer;
    wrapper;
    curSpan;
    viewerFullscreen;
    totalImagens: number;
    indexImagemAtual: number;
    rotacaoImagemAtual: number;
    stringDownloadImagem: string;
    isImagemVertical: boolean;
    mostrarPainelOpcoes = true;
    showOnlyPDF = false;

    zoomPercent = 100;

    constructor(private renderer: Renderer2) {}

    ngOnInit() {
        if (this.loadOnInit) {
            this.isImagensPresentes();
        }
    }

    ngAfterViewInit() {
        this.inicializarCores();
        if (this.loadOnInit) {
            this.inicializarImageViewer();
            setTimeout(() => {
                this.showImage();
            }, 1000);
        }
    }

    private inicializarCores() {
        this.setStyleClass('inline-icon', 'background-color', this.primaryColor);
        this.setStyleClass('footer-info', 'background-color', this.primaryColor);
        this.setStyleClass('footer-icon', 'color', this.buttonsColor);
    }

    ngOnChanges(changes: SimpleChanges) {
        this.imagesChange(changes);
        this.primaryColorChange(changes);
        this.buttonsColorChange(changes);
        this.defaultDownloadNameChange(changes);
    }

    zoomIn() {
        this.zoomPercent += 10;
        this.viewer.zoom(this.zoomPercent);
    }

    zoomOut() {
        if (this.zoomPercent === 100) {

            return;
        }

        this.zoomPercent -= 10;

        if (this.zoomPercent < 0) {

            this.zoomPercent = 0;
        }

        this.viewer.zoom(this.zoomPercent);
    }

    primaryColorChange(changes: SimpleChanges) {
        if (changes['primaryColor'] || changes['showOptions']) {
            setTimeout(() => {
                this.setStyleClass('inline-icon', 'background-color', this.primaryColor);
                this.setStyleClass('footer-info', 'background-color', this.primaryColor);
            }, 350);
        }
    }

    buttonsColorChange(changes: SimpleChanges) {
        if (changes['buttonsColor'] || changes['rotate'] || changes['download']
        || changes['fullscreen']) {
            setTimeout(() => {

                this.setStyleClass('footer-icon', 'color', this.buttonsColor);
            }, 350);
        }
    }

    defaultDownloadNameChange(changes: SimpleChanges) {
        if (changes['defaultDownloadName']) {
            this.defaultDownloadName = this.defaultDownloadName;
        }
    }

    imagesChange(changes: SimpleChanges) {
        if (changes['images'] && this.isImagensPresentes()) {
            this.inicializarImageViewer();
            setTimeout(() => {
                this.showImage();
            }, 1000);
        }
    }

    isImagensPresentes() {
        return this.images
            && this.images.length > 0;
    }

    inicializarImageViewer() {
        this.indexImagemAtual = 1;
        this.totalImagens = this.images.length;
        this.wrapper = document.getElementById(this.idContainer);
        this.curSpan = this.wrapper.find('.current');
        this.viewer = ImageViewer(this.wrapper.find('.image-container'));
        this.wrapper.find('.total').html(this.totalImagens);
        this.rotacaoImagemAtual = 0;
    }

    showImage() {
        this.prepararTrocaImagem();

        let imgObj = this.BASE_64_PNG;
        if (this.isPDF()) {

            this.carregarViewerPDF();
        } else if (this.isURlImagem()) {

            this.getImagemAtual().then( image => {
                imgObj = image;
                this.stringDownloadImagem = image;
            })

        } else {
            imgObj = this.BASE_64_PNG + this.getImagemAtual();
            this.stringDownloadImagem = this.BASE_64_IMAGE + this.getImagemAtual();
        }
        this.viewer.load(imgObj, imgObj);
        this.curSpan.html(this.indexImagemAtual);
        this.inicializarCores();
    }

    carregarViewerPDF() {
        this.esconderBotoesImageViewer();
        const {widthIframe, heightIframe} = this.getTamanhoIframe();
        this.injetarIframe(widthIframe, heightIframe);
    }

    injetarIframe(widthIframe: number, heightIframe: number) {
        const ivImageWrap = document.getElementsByClassName('iv-image-wrap').item(0);

        const iframe = document.createElement('iframe');

        iframe.id = this.getIdIframe();
        iframe.style.width = `${widthIframe}px`;
        iframe.style.height = `${heightIframe}px`;
        iframe.src = `${this.converterPDFBase64ParaBlob()}`;

        this.renderer.appendChild(ivImageWrap, iframe);
    }

    getTamanhoIframe() {

        const container = document.getElementById(this.idContainer);

        const widthIframe = container.offsetWidth;
        const heightIframe = container.offsetHeight;
        return {widthIframe, heightIframe};
    }

    esconderBotoesImageViewer() {
        this.setStyleClass('iv-loader', 'visibility', 'hidden');
        this.setStyleClass('options-image-viewer', 'visibility', 'hidden');
    }

    isPDF() {
        return this.getImagemAtual().then(result => {
            return result.startsWith('JVBE') || result.startsWith('0M8R');
        })
    }

    isURlImagem() {
        return this.getImagemAtual().then( result => result.match(new RegExp(/(https|http|www\.)/g)));
    }

    prepararTrocaImagem() {
        this.rotacaoImagemAtual = 0;
        this.limparCacheElementos();
    }

    limparCacheElementos() {

        const container = document.getElementById(this.idContainer);
        const iframeElement = document.getElementById(this.getIdIframe());
        const ivLargeImage = document.getElementsByClassName('iv-large-image').item(0);

        if (iframeElement) {

            this.renderer.removeChild(container, iframeElement);
        }

        if (iframeElement) {

            this.renderer.removeChild(container, ivLargeImage);
        }

        this.setStyleClass('iv-loader', 'visibility', 'auto');
        this.setStyleClass('options-image-viewer', 'visibility', 'inherit');
    }

    proximaImagem() {
        this.isImagemVertical = false;
        this.indexImagemAtual++;
        if (this.indexImagemAtual > this.totalImagens) {
            this.indexImagemAtual = 1;
        }
        this.onNext.emit(this.indexImagemAtual);
        if (!this.isPDF() && this.showOnlyPDF) {
            this.proximaImagem();
            return;
        }
        this.showImage();
    }

    imagemAnterior() {
        this.isImagemVertical = false;
        this.indexImagemAtual--;
        if (this.indexImagemAtual <= 0) {
            this.indexImagemAtual = this.totalImagens;
        }
        this.onPrevious.emit(this.indexImagemAtual);
        if (!this.isPDF() && this.showOnlyPDF) {
            this.imagemAnterior();
            return;
        }
        this.showImage();
    }

    rotacionarDireita() {
        const timeout = this.resetarZoom();
        setTimeout(() => {
            this.rotacaoImagemAtual += this.ROTACAO_PADRAO_GRAUS;
            this.isImagemVertical = !this.isImagemVertical;
            this.atualizarRotacao();
        }, timeout);
    }

    rotacionarEsquerda() {
        const timeout = this.resetarZoom();
        setTimeout(() => {
            this.rotacaoImagemAtual -= this.ROTACAO_PADRAO_GRAUS;
            this.isImagemVertical = !this.isImagemVertical;
            this.atualizarRotacao();
        }, timeout);
    }

    resetarZoom(): number {
        this.zoomPercent = 100;
        this.viewer.zoom(this.zoomPercent);
        let timeout = 800;
        if (this.viewer.zoomValue === this.zoomPercent) {
            timeout = 0;
        }
        return timeout;
    }

    atualizarRotacao(isAnimacao = true) {
        let scale = '';
        if (this.isImagemVertical && this.isImagemSobrepondoNaVertical()) {
            scale = `scale(${this.getScale()})`;
        }
        const novaRotacao = `rotate(${this.rotacaoImagemAtual}deg)`;
        this.carregarImagem(novaRotacao, scale, isAnimacao);
    }

    getScale() {

        const containerElement = document.getElementById(this.idContainer);
        const ivLargeImageElement = document.getElementsByClassName('iv-large-image').item(0);
        const diferencaTamanhoImagem = ivLargeImageElement.clientWidth - containerElement.clientHeight;

        if (diferencaTamanhoImagem >= 250 && diferencaTamanhoImagem < 300) {

            return (ivLargeImageElement.clientWidth - containerElement.clientHeight) / (containerElement.clientHeight) - 0.1;
        } else if (diferencaTamanhoImagem >= 300 && diferencaTamanhoImagem < 400) {

            return ((ivLargeImageElement.clientWidth - containerElement.clientHeight) / (containerElement.clientHeight)) - 0.15;
        } else if (diferencaTamanhoImagem >= 400) {

            return ((ivLargeImageElement.clientWidth - containerElement.clientHeight) / (containerElement.clientHeight)) - 0.32;
        }

        return 0.6;
    }

    isImagemSobrepondoNaVertical() {

        const margemErro = 5;
        const containerElement: Element = document.getElementById(this.idContainer);
        const ivLargeImageElement: Element = document.getElementsByClassName('iv-large-image').item(0);

        return containerElement.clientHeight < ivLargeImageElement.clientWidth + margemErro;
    }

    carregarImagem(novaRotacao: string, scale: string, isAnimacao = true) {
        if (isAnimacao) {
            this.adicionarAnimacao('iv-snap-image');
            this.adicionarAnimacao('iv-large-image');
        }
        this.adicionarRotacao('iv-snap-image', novaRotacao, scale);
        this.adicionarRotacao('iv-large-image', novaRotacao, scale);
        setTimeout(() => {
            if (isAnimacao) {
                this.retirarAnimacao('iv-snap-image');
                this.retirarAnimacao('iv-large-image');
            }
        }, 501);
    }

    retirarAnimacao(componente: string) {
        this.setStyleClass(componente, 'transition', 'auto');
    }

    adicionarRotacao(componente: string, novaRotacao: string, scale: string) {
        this.setStyleClass(componente, 'transform', `${novaRotacao} ${scale}`);
    }

    adicionarAnimacao(componente: string) {
        this.setStyleClass(componente, 'transition', `0.5s linear`);
    }

    mostrarFullscreen() {
        const timeout = this.resetarZoom();
        setTimeout(() => {

            this.viewerFullscreen = ImageViewer();
            let imgSrc;

            if (this.isURlImagem()) {

                imgSrc = this.getImagemAtual();
            } else {

                imgSrc = this.BASE_64_PNG + this.getImagemAtual();
            }
            this.viewerFullscreen.show(imgSrc, imgSrc);
            this.atualizarRotacao(false);
        }, timeout);
    }

    converterPDFBase64ParaBlob() {

        const arrBuffer = this.base64ToArrayBuffer(this.getImagemAtual());

        const newBlob = new Blob([arrBuffer], { type: 'application/pdf' });

        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(newBlob);
            return;
        }

        return window.URL.createObjectURL(newBlob);
    }

    private async getImagemAtual() {
        return await this.images[this.indexImagemAtual - 1];
    }

    base64ToArrayBuffer(data) {
        const binaryString = window.atob(data);
        const binaryLen = binaryString.length;
        const bytes = new Uint8Array(binaryLen);
        for (let i = 0; i < binaryLen; i++) {
            const ascii = binaryString.charCodeAt(i);
            bytes[i] = ascii;
        }
        return bytes;
    }

    showPDFOnly() {
        this.showOnlyPDF = !this.showOnlyPDF;
        this.proximaImagem();
    }

    setStyleClass(nomeClasse: string, nomeStyle: string, cor: string) {

        let cont;
        const listaElementos = document.getElementsByClassName(nomeClasse);

        for (cont = 0; cont < listaElementos.length; cont++) {

            this.renderer.setStyle(listaElementos.item(cont), nomeStyle, cor);
        }
    }

    atualizarCorHoverIn(event: MouseEvent) {

        this.renderer.setStyle(event.srcElement, 'color', this.buttonsHover);
    }

    atualizarCorHoverOut(event: MouseEvent) {

        this.renderer.setStyle(event.srcElement, 'color', this.buttonsColor);
    }

    getIdIframe() {
        return this.idContainer + '-iframe'
    }
}
