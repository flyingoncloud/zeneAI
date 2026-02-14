export const LOGIN_REQUIRED_EVENT = 'zeneme:login-required';

export const triggerLoginRequired = (targetView?: string) => {
  window.dispatchEvent(
    new CustomEvent(LOGIN_REQUIRED_EVENT, {
      detail: { targetView },
    })
  );
};

export const triggerNavigateAuth = () => {
  window.dispatchEvent(new Event('zeneme:navigate-auth'));
};
