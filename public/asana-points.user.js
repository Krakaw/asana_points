// ==UserScript==
// @name         Asana Server based point tracker
// @namespace    https://asana.metalworks.tarilabs.com/
// @version      0.1
// @description  Use the server points
// @author       Krakaw
// @match        https://app.asana.com/*
// @grant        GM_xmlhttpRequest
// @connect      asana.metalworks.tarilabs.com
// ==/UserScript==

(function() {
    'use strict';

    let cache = {};
    function fetch() {
        GM_xmlhttpRequest ( {
            method:     'GET',
            url:        'https://asana.metalworks.tarilabs.com',
            onload:     function (r) {
                cache = JSON.parse(r.responseText);
                process()
            }
        } );
    }

    function process() {
        const table = document.createElement('table');
        _perSprint(cache.data.sprints, table);
    }

    function _perSprint(sprints, table) {

        for (let sprintNumber in sprints) {
            const sprint = sprints[sprintNumber];
            const row = document.createElement('tr');
            table.append(row);
            const th = document.createElement('th');
            th.innerText = sprintNumber;
            row.append(th);


        }
    }
    fetch();




})();
