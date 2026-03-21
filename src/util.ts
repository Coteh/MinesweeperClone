export const createDialogContentFromTemplate = (tmplContentId: string) => {
    const contentTmpl = document.querySelector(tmplContentId) as HTMLTemplateElement;
    const contentClone = contentTmpl.content.cloneNode(true) as HTMLElement;

    return contentClone;
};
