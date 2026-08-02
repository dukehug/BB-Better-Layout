// BB Better Layout - Group Space avatar profile dialog.
// Makes member avatars keyboard-accessible and opens a larger local preview.

(() => {
    const BBLayout = window.BBLayout = window.BBLayout || {};
    const DIALOG_ID = 'bb-group-profile-dialog';

    function closeDialog() {
        const overlay = document.getElementById(DIALOG_ID);
        if (!overlay) return;

        const trigger = overlay.bbProfileTrigger;
        overlay.remove();
        if (trigger?.isConnected) trigger.focus();
    }

    function openDialog(trigger) {
        const image = trigger.querySelector('img');
        const row = trigger.closest('[role="row"], tr');
        const name = image?.alt?.trim()
            || row?.querySelector('bdi')?.textContent.trim()
            || 'Group member';

        closeDialog();

        const overlay = document.createElement('div');
        overlay.id = DIALOG_ID;
        overlay.className = 'bb-group-profile-overlay';
        overlay.bbProfileTrigger = trigger;

        const dialog = document.createElement('div');
        dialog.className = 'usercard showcard bb-group-profile-card';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-label', `Profile picture for ${name}`);

        const header = document.createElement('div');
        header.className = 'header';

        const title = document.createElement('h2');
        title.className = 'bb-group-profile-name';
        title.textContent = name;

        const avatarView = document.createElement('user-avatar-view');
        const avatarRoot = document.createElement('div');
        avatarRoot.className = 'MuiAvatar-root';

        if (image) {
            const enlargedImage = document.createElement('img');
            enlargedImage.className = 'MuiAvatar-img';
            enlargedImage.src = image.currentSrc || image.src;
            enlargedImage.alt = name;
            avatarRoot.appendChild(enlargedImage);
        } else {
            const initials = document.createElement('span');
            initials.className = 'bb-group-profile-initials';
            initials.textContent = trigger.textContent.trim();
            avatarRoot.appendChild(initials);
        }

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'bb-group-profile-close';
        closeButton.setAttribute('data-bb-group-profile-close', '');
        closeButton.setAttribute('aria-label', 'Close profile picture');
        closeButton.textContent = '×';

        avatarView.appendChild(avatarRoot);
        header.appendChild(title);
        header.appendChild(avatarView);
        dialog.appendChild(header);
        dialog.appendChild(closeButton);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        closeButton.focus();
    }

    function enhanceAvatars() {
        if (!document.documentElement.classList.contains('bb-route-group-space')) {
            closeDialog();
            return;
        }

        document
            .querySelectorAll('[role="grid"][aria-label="Group Members"] .MuiAvatar-root')
            .forEach((avatar) => {
                if (avatar.classList.contains('bb-group-profile-trigger')) return;

                const image = avatar.querySelector('img');
                const row = avatar.closest('[role="row"], tr');
                const name = image?.alt?.trim()
                    || row?.querySelector('bdi')?.textContent.trim()
                    || 'group member';

                avatar.classList.add('bb-group-profile-trigger');
                avatar.setAttribute('role', 'button');
                avatar.setAttribute('tabindex', '0');
                avatar.setAttribute('aria-label', `View profile picture for ${name}`);
            });
    }

    function handleClick(event) {
        if (!(event.target instanceof Element)) return;

        if (event.target.closest('[data-bb-group-profile-close]')) {
            closeDialog();
            return;
        }

        const overlay = event.target.closest(`#${DIALOG_ID}`);
        if (overlay && event.target === overlay) {
            closeDialog();
            return;
        }

        const trigger = event.target.closest('.bb-group-profile-trigger');
        if (trigger) openDialog(trigger);
    }

    function handleKeydown(event) {
        if (event.key === 'Escape' && document.getElementById(DIALOG_ID)) {
            closeDialog();
            return;
        }

        if (
            (event.key === 'Enter' || event.key === ' ')
            && event.target.classList?.contains('bb-group-profile-trigger')
        ) {
            event.preventDefault();
            openDialog(event.target);
        }
    }

    function initialize() {
        document.addEventListener('click', handleClick);
        document.addEventListener('keydown', handleKeydown);
    }

    BBLayout.groupSpace = {
        initialize,
        run: enhanceAvatars
    };
})();
