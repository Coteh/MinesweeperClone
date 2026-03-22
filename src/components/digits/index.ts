import { AssetManager } from '../../manager/asset';

type DigitsComponentProps = {
    assetManager: AssetManager;
};

export type DigitsRenderProps = {
    parentElem: HTMLElement;
    digits: number;
};

export const createDigitsComponent = ({ assetManager }: DigitsComponentProps) => {
    return ({parentElem, digits}: DigitsRenderProps) => {
        let digitStr;
        if (digits < 0) {
            digitStr = Math.abs(digits).toString().padStart(3, '0');
            digitStr = '-' + digitStr.slice(1);
        } else {
            digitStr = digits.toString();
        }

        const children = parentElem.children;

        if (digitStr.length > children.length) {
            throw new Error('More digits than available digit images');
        }

        for (let i = 0; i < children.length; i++) {
            const pre = assetManager.getImage('img/digits/0.png');
            const item = children.item(i) as HTMLImageElement;
            item.src = pre ? pre.src : 'img/digits/0.png';
            item.dataset.asset = 'img/digits/0.png';
        }

        let j = 0;
        for (let i = digitStr.length - 1; i >= 0; i--) {
            const digit = digitStr[i];
            const item = children.item(children.length - 1 - j) as HTMLImageElement;
            const pre = assetManager.getImage(`img/digits/${digit}.png`);
            item.src = pre ? pre.src : `img/digits/${digit}.png`;
            item.dataset.asset = `img/digits/${digit}.png`;
            j++;
        }

        parentElem.dataset.count = digits.toString();
    };
};
