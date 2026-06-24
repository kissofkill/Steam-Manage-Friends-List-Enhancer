// ==UserScript==
// @name         Steam Manage Friends List Enhancer
// @namespace    https://steamcommunity.com/
// @version      1
// @description  Multiselect friends by a list and redable list with sorter
// @author       KoK
// @match        https://steamcommunity.com/*/friends*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let autoMove = true;

    function createUI() {
        const panel = document.createElement('div');
        panel.id = 'smfle_panel';

        panel.innerHTML = `
            <div id="smfle_header">
                <span>Steam Manage Friends List Enhancer</span>
                <button id="smfle_toggle">−</button>
            </div>

            <div id="smfle_content">
                <div id="smfle_status">Waiting...</div>

                <button id="enableManageBtn">Enable Manage Friends List</button>

                <textarea
                    id="friendNames"
                    placeholder="One friend name per line"
                ></textarea>

                <label id="autoMoveLabel">
                    <input
                        type="checkbox"
                        id="autoMoveCheckbox"
                        checked
                    >
                    Auto move selected friends to top
                </label>

                <button id="selectFriendsBtn">Select Friends</button>
                <button id="moveSelectedBtn">Move Selected To Top</button>
                <button id="clearSelectionBtn">Clear Selection</button>

                <div id="selectedCount">Selected: 0</div>
                <div id="resultText">Ready</div>
            </div>
        `;

        document.body.appendChild(panel);

        const style = document.createElement('style');
        style.textContent = `
            #smfle_panel{
                position:fixed;
                top:100px;
                right:20px;
                width:340px;
                z-index:999999999;
                background:rgba(21,39,73,.9);
                border:2px solid rgb(103,114,137);
                border-radius:8px;
                color:white;
                font-family:Arial,sans-serif;
                resize:both;
                overflow:auto;
                min-width:250px;
            }

            #smfle_header{
                display:flex;
                justify-content:space-between;
                align-items:center;
                padding:8px;
                cursor:move;
                font-weight:bold;
                color:white;
                background:rgba(0,0,0,.2);
            }

            #smfle_content{
                padding:10px;
            }

            #friendNames{
                width:100%;
                height:180px;
                box-sizing:border-box;
                margin-top:6px;
                margin-bottom:8px;
                background:rgba(0,0,0,.2);
                color:white;
                border:1px solid rgb(103,114,137);
            }

            #smfle_panel button{
                width:100%;
                margin-bottom:6px;
                padding:8px;
                background:rgb(42,98,143);
                color:white;
                border:1px solid rgb(103,114,137);
                cursor:pointer;
            }

            #smfle_toggle{
                width:28px !important;
                height:28px;
                margin:0 !important;
            }

            #smfle_status,
            #selectedCount,
            #resultText,
            #autoMoveLabel{
                color:white;
                margin-bottom:8px;
            }
        `;
        document.head.appendChild(style);

        setupEvents();
        setupDragging();
    }

    function setupDragging() {
        const panel = document.getElementById('smfle_panel');
        const header = document.getElementById('smfle_header');

        let dragging = false;
        let offsetX = 0;
        let offsetY = 0;

        header.addEventListener('mousedown', e => {
            dragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
        });

        document.addEventListener('mousemove', e => {
            if (!dragging) return;

            panel.style.left = (e.clientX - offsetX) + 'px';
            panel.style.top = (e.clientY - offsetY) + 'px';
            panel.style.right = 'auto';
        });

        document.addEventListener('mouseup', () => {
            dragging = false;
        });
    }

    function isManageModeActive() {
        const btn = document.querySelector('#manage_friends_control');
        if (btn && btn.classList.contains('btn_active')) return true;

        const manageFriendBlocks = document.querySelector('.friend_block_v2.manage');
        if (manageFriendBlocks) return true;

        const selectableChecks = document.querySelector('.select_friend_checkbox');
        return !!selectableChecks;
    }

    function updateStatus() {
        const status = document.getElementById('smfle_status');
        if (!status) return;

        if (isManageModeActive()) {
            status.textContent = '🟢 Manage Friends List Active';
            status.style.color = '#7CFC00';
        } else {
            status.textContent = '🔴 Waiting For Manage Friends List';
            status.style.color = '#ff6666';
        }

        updateSelectedCount();
    }

    function updateSelectedCount() {
        const count = document.querySelectorAll(
            '.friend_block_v2.selected, .friend_block_v2.active'
        ).length;

        const el = document.getElementById('selectedCount');
        if (el) {
            el.textContent = 'Selected: ' + count;
        }
    }

    function enableManageMode() {
        const btn = document.querySelector('#manage_friends_control');
        if (btn && !btn.classList.contains('btn_active')) {
            btn.click();
        }

        setTimeout(updateStatus, 300);
        setTimeout(updateStatus, 800);
        setTimeout(updateStatus, 1500);
    }

    function getFriendName(friend) {
        const content = friend.querySelector('.friend_block_content');
        if (!content) return '';

        const firstLine = content.childNodes[0];
        if (firstLine && firstLine.textContent) {
            return firstLine.textContent.trim().toLowerCase();
        }

        return content.textContent.trim().split('\n')[0].trim().toLowerCase();
    }

    function triggerFriendSelection(friend) {
        const checkbox = friend.querySelector('.select_friend_checkbox');
        const overlay = friend.querySelector('.selectable_overlay');

        const targets = [friend, overlay, checkbox].filter(Boolean);

        for (const target of targets) {
            try {
                target.dispatchEvent(new MouseEvent('mousedown', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                }));
                target.dispatchEvent(new MouseEvent('mouseup', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                }));
                target.dispatchEvent(new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                }));
            } catch (e) {
                // ignore and keep trying other targets
            }
        }

        if (checkbox) {
            try {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('input', { bubbles: true }));
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            } catch (e) {
                // ignore
            }
        }
    }

    async function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function selectFriends() {
        if (!isManageModeActive()) {
            alert('Enable Manage Friends List first.');
            return;
        }

        const names = document.getElementById('friendNames')
            .value
            .split('\n')
            .map(x => x.trim().toLowerCase())
            .filter(Boolean);

        let selected = 0;
        const friends = [...document.querySelectorAll('.friend_block_v2')];

        for (const friend of friends) {
            const friendName = getFriendName(friend);
            if (!friendName || !names.includes(friendName)) continue;

            if (friend.classList.contains('selected') || friend.classList.contains('active')) {
                continue;
            }

            triggerFriendSelection(friend);

            await wait(80);

            if (friend.classList.contains('selected') || friend.classList.contains('active')) {
                selected++;
                updateSelectedCount();
            } else {
                triggerFriendSelection(friend);
                await wait(80);

                if (friend.classList.contains('selected') || friend.classList.contains('active')) {
                    selected++;
                    updateSelectedCount();
                }
            }
        }

        document.getElementById('resultText').textContent = `Selected ${selected} friends`;

        if (autoMove) {
            setTimeout(moveSelectedToTop, 500);
        }
    }

    function moveSelectedToTop() {
        const container = document.querySelector('#search_results');
        if (!container) return;

        const selected = [...container.querySelectorAll('.friend_block_v2.selected, .friend_block_v2.active')];

        selected.reverse().forEach(friend => {
            container.prepend(friend);
        });

        updateSelectedCount();
    }

    function clearSelection() {
        document
            .querySelectorAll('.friend_block_v2.selected, .friend_block_v2.active')
            .forEach(friend => {
                const checkbox = friend.querySelector('.select_friend_checkbox');
                if (checkbox) {
                    try {
                        checkbox.click();
                    } catch (e) {
                        triggerFriendSelection(friend);
                    }
                } else {
                    triggerFriendSelection(friend);
                }
            });

        document.getElementById('resultText').textContent = 'Selection Cleared';
        updateSelectedCount();
    }

    function setupEvents() {
        document.getElementById('enableManageBtn').onclick = enableManageMode;
        document.getElementById('selectFriendsBtn').onclick = selectFriends;
        document.getElementById('moveSelectedBtn').onclick = moveSelectedToTop;
        document.getElementById('clearSelectionBtn').onclick = clearSelection;

        document.getElementById('autoMoveCheckbox').onchange = function () {
            autoMove = this.checked;
        };

        document.getElementById('smfle_toggle').onclick = function () {
            const content = document.getElementById('smfle_content');

            if (content.style.display === 'none') {
                content.style.display = '';
                this.textContent = '−';
            } else {
                content.style.display = 'none';
                this.textContent = '+';
            }
        };
    }

    function init() {
        createUI();

        setInterval(updateStatus, 1000);

        setInterval(() => {
            if (autoMove) {
                const count = document.querySelectorAll(
                    '.friend_block_v2.selected, .friend_block_v2.active'
                ).length;

                if (window.lastCount !== count) {
                    window.lastCount = count;
                    moveSelectedToTop();
                }
            }
        }, 1000);
    }

    setTimeout(init, 2000);

})();