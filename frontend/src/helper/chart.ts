const generateRandomColors = function (numColors) {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        colors.push(`rgb(${r}, ${g}, ${b})`); 
    }
    return colors;
};

function getYaxisId(key) {
    let res = 'y';

    if (!key) {
        return res;
    }

    if (key === 'pressure') {
        return 'y1';
    }

    return res;
}

const prepareDataForChart = function({ labelsNames, labelsBasic, colors, data }) {
    const datasets = [];
    const maps = new Map();
    const labels = [];

    for (const item of data) {
        labels.push(item.date);
        for (const key in item) {
        if (labelsBasic.includes(key)) {
            if ('temperature' === key) {
                const list = maps.has('temperature_min') ? maps.get('temperature_min') : [];
                const list2 = maps.has('temperature_max') ? maps.get('temperature_max') : [];
                const list3 = maps.has('temperature_1') ? maps.get('temperature_1') : [];
                const list4 = maps.has('temperature_2') ? maps.get('temperature_2') : [];
                const list5 = maps.has('temperature_3') ? maps.get('temperature_3') : [];
                const list6 = maps.has('temperature_4') ? maps.get('temperature_4') : [];
                maps.set('temperature_min', [...list, {x: item.date, y: item?.temperature?.min || null }]);
                maps.set('temperature_max', [...list2, {x: item.date, y: item?.temperature?.max || null }]);
                maps.set('temperature_1', [...list3, {x: item.date, y: item?.temperature?.morning || null }]);
                maps.set('temperature_2', [...list4, {x: item.date, y: item?.temperature?.afternoon || null }]);
                maps.set('temperature_3', [...list5, {x: item.date, y: item?.temperature?.evening || null }]);
                maps.set('temperature_4', [...list6, {x: item.date, y: item?.temperature?.night || null }]);
            } else if ('humidity' === key) {
                const list = maps.has('humidity') ? maps.get('humidity') : [];
                maps.set(key, [...list, {x: item.date, y: item?.humidity?.afternoon || item?.humidity }]);
            } else if ('pressure' === key) {
                const list = maps.has('pressure') ? maps.get('pressure') : [];
                maps.set(key, [...list, {x: item.date, y: item?.pressure?.afternoon || item?.pressure }]);
            } else if ('precipitation' === key) {
                const list = maps.has('precipitation') ? maps.get('precipitation') : [];
                maps.set(key, [...list, {x: item.date, y: item?.precipitation?.total || item?.precipitation }]);
            } else if ('wind' === key) {
                const list = maps.has('wind') ? maps.get('wind') : [];
                maps.set(key, [...list, {x: item.date, y: item?.wind?.max?.speed || item?.wind}]);
            } else if ('cloud_cover' === key) {
                const list = maps.has('cloud_cover') ? maps.get('cloud_cover') : [];
                maps.set(key, [...list, {x: item.date, y: item?.cloud_cover?.afternoon || item?.cloud_cover}]);
            } else if ('temperature_min' === key) {
                const list = maps.has('temperature_min') ? maps.get('temperature_min') : [];
                
                maps.set('temperature_min', [...list, {x: item.date, y: item?.temperature_min || null }]);
            } else if ('temperature_max' === key) {
                const list = maps.has('temperature_max') ? maps.get('temperature_max') : [];
                
                maps.set('temperature_max', [...list, {x: item.date, y: item?.temperature_max || null }]);
            } else if ('temperature_1' === key) {
                const list = maps.has('temperature_1') ? maps.get('temperature_1') : [];
                
                maps.set('temperature_1', [...list, {x: item.date, y: item?.temperature_1 || null }]);
            } else if ('temperature_2' === key) {
                const list = maps.has('temperature_2') ? maps.get('temperature_2') : [];
                
                maps.set('temperature_2', [...list, {x: item.date, y: item?.temperature_2 || null }]);
            } else if ('temperature_3' === key) {
                const list = maps.has('temperature_3') ? maps.get('temperature_3') : [];
                
                maps.set('temperature_3', [...list, {x: item.date, y: item?.temperature_3 || null }]);
            } else if ('temperature_4' === key) {
                const list = maps.has('temperature_4') ? maps.get('temperature_4') : [];
                
                maps.set('temperature_4', [...list, {x: item.date, y: item?.temperature_4 || null }]);
            }
        }
        }
    }
    let i = 0;
    for (const key of labelsNames) {
        datasets.push({
            label: key,
            data: maps.get(key),
            fill: false,
            borderColor: colors[i],
            backgroundColor: colors[i],
            tension: 0.1,
            yAxisID: getYaxisId(key),
        });
        i++;
    }
    return { labels, datasets };
};

export { generateRandomColors, prepareDataForChart };