import feather from 'feather-icons';

export class ActionIconManager {
    private iconsLoaded: boolean = false;

    constructor() {
        this.iconsLoaded = false;
    }

    // TODO: Callers outside of ActionIconManager should invoke feather.replace() using this method
    public loadIcons() {
        feather.replace();
        this.iconsLoaded = true;
    }

    public changeIcon(parentElement: HTMLElement, newIcon: string) {
        let childElement = parentElement.querySelector('svg') as HTMLOrSVGElement;
        if (childElement) {
            (childElement as SVGElement).remove();
            childElement = document.createElement('i');
        } else {
            childElement = parentElement.querySelector('i') as HTMLElement;
        }
        (childElement as HTMLElement).setAttribute('data-feather', newIcon);
        parentElement.prepend(childElement as HTMLElement);
        // TODO: ActionIconManager should handle feather.replace()
        // Should only re-replace icons if icons were previously loaded.
        // if (this.iconsLoaded) {
        feather.replace();
        // }
    }
}
