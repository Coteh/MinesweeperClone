let questionMode = false;

export const setQuestionMode = (enabled: boolean) => {
    questionMode = !!enabled;
};

export const toggleQuestionMode = () => {
    questionMode = !questionMode;
    return questionMode;
};

export const getQuestionMode = () => questionMode;
