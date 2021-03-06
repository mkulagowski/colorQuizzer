/*
 * String .format() implementation
 */
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

/*
 * Fisher - Yates shuffle
 * 
 * @param array    Array to shuffle
 * @param nb_picks Number of shuffled elements to return
 */
function shuffle2(array, nb_picks) {
    var r, t;
    for (i = array.length - 1; i > 1; i--)
    {
        r = Math.floor(Math.random() * i);
        t = array[i];
        array[i] = array[r];
        array[r] = t;
    }

    return array.slice(0, nb_picks);
}

/*
 * Fisher - Yates shuffle
 * 
 * @param array Array to shuffle
 */
function shuffle(array) {
    var r, t;
    for (i = array.length - 1; i > 1; i--)
    {
        r = Math.floor(Math.random() * i);
        t = array[i];
        array[i] = array[r];
        array[r] = t;
    }

    return array;
}

/*
 * Construct color object
 * 
 * @param item JSON color item
 */
function colorObject(item) {
    return {
        "name_pl": item.name_pl,
        "name_eng": item.name_eng,
        "color": item.color,
        "category": item.baseColor
    };
}

/*
 * Construct color and container pair object
 * 
 * @param color     Color object
 * @param container Container object
 */
function colorPairObject(color, container) {
    return {
        "color": color,
        "container": container
    };
}

/*
 * Parse JSON document with colors
 * 
 * @param data JSON document to parse
 */
function parseColors(data) {
    return $.map(data, function(item) {
        return colorObject(item);
    });
}

/*
 * Shuffle given array and set appropriate nodes
 *
 * @param testColor Chosen color from @array
 * @param array     Array of colors
 * @return Index of the node with chosen color. -1 if not found in array.
 */
function shuffleSetColors(testColor, array) {
    var container = -1;

    // Reshuffle our 4 colors
    var colArray = shuffle(array);

    // For each color...
    for (i = 0; i < colArray.length; i++)
    {
        // ... change nodes color
        var objId = '#c' + (i + 1);
        var col = colArray[i].color;
        $(objId).css("background-color", col);

        // ... if it's the 'test color', store it's index
        if (col == testColor.color)
            container = i + 1;
    }

    return container;
}

/*
 * Randomize 4 colors and set appropriate nodes
 * 
 * @param array Array to shuffle
 * @return Color that is being tested and it's node's index
 */
function randomColors(colors) {
    // Shuffle colors and pick an array of 4
    var colArray = shuffle2(colors, 4);

    // First color will be the 'test color'
    var primaryColor = colArray[0];

    // Shuffle and set appropriate nodes
    var primaryContainer = shuffleSetColors(primaryColor, colArray);

    return colorPairObject(primaryColor, primaryContainer);
}

/*
 * Randomize 4 colors from the single category and set appropriate nodes
 * 
 * @param array Array to shuffle
 * @return Color that is being tested and it's node's index
 */
function randomCloseColors(colors, colorsMap) {
    // Randomize single color and get it's category
    var subCategory = colors[Math.floor(Math.random() * colors.length)].category;
    
    // Shuffle previously chosen category and pick an array of 4
    var colArray = shuffle2(colorsMap.get(subCategory), 4);

    // First color will be the 'test color'
    var primaryColor = colArray[0];

    // Shuffle and set appropriate nodes
    var primaryContainer = shuffleSetColors(primaryColor, colArray);

    return colorPairObject(primaryColor, primaryContainer);
}

/*
 * Creates map out of an array of color objects
 * 
 * @param array Array of color objects
 */
function prepareColorMap(array) {
    var colorMap = new Map();

    // Append each color to the proper place in map
    array.forEach(function(data) {
        var tempArray;

        if (colorMap.has(data.category))
            tempArray = colorMap.get(data.category);
        else
            tempArray = new Array();

        tempArray.push(data);
        colorMap.set(data.category, tempArray);
    });

    return colorMap;
};

/*
 * Initialization
 */
$().ready(function() {
    // Containers for color data
    var gColorsArray, gColorsMap;

    // Variables for currently tested color
    var gCurrentColor, gCurrentContainer, gCurrentLang = "pl";

    // Counter that tracks current streak
    var gCounter = 0;

    // Template for color names. Node name can be created by appending language
    const cNameTemplate = "name_";

    // Template for question
    var cQuestionTemplate = {
        "pl" : "Ktory kolor to {0} ?",
        "eng": "Which colour is {0} ?"
    };

    // Template for result message
    const cMsg = {
        "pl": ["ZLE", "DOBRZE"],
        "eng": ["WRONG", "RIGHT"]
    };

    // Template for question
    const cCounterTemplate = {
        "pl" : "DOBRE ODP: {0}",
        "eng": "RIGHT ANS: {0}"
    };

    // Template for mode
    const cModeTemplate = {
        "pl" : "TRYB {0}",
        "eng": "MODE {0}"
    };

    /*
     * Function for refreshing color nodes on page
     */
    function refreshColors() {
        var colorPair;

        // Check current mode and randomize colors in appropriate way
        if ($('#modeSwitch').val() == 1)
            colorPair = randomCloseColors(gColorsArray, gColorsMap);
        else
            colorPair = randomColors(gColorsArray);

        // Store current test color
        gCurrentColor = colorPair.color;
        gCurrentContainer = colorPair.container;

        // Update question with test color's name
        setNodeTextMultilang($('#question'), cQuestionTemplate, gCurrentColor[cNameTemplate + gCurrentLang]);
    };

    /*
     * Function for setting nodes text according to current language
     *
     * @remarks This function takes variable number of arguments.
     *          First argument have to be a node, second a format string and the rest
     *          have to be format arguments.
     */
    function setNodeTextMultilang() {
        if (arguments.length < 2)
            return;

        var node = arguments[0];
        var formatStr = arguments[1];


        // Update question with test color's name
        if (arguments.length > 2) {
            var argArray = new Array();
            for (i = 2; i < arguments.length; i++)
                argArray.push(arguments[i]);

            node.text(formatStr[gCurrentLang].format(argArray));
        } else
            node.text(formatStr[gCurrentLang]);

        return;
    };


    // Parse JSON with colors
    $.getJSON("colors.json").done(function(data) {
        
        // Parse JSON to get color array
        gColorsArray = parseColors(data);

        // Construct color map
        gColorsMap = prepareColorMap(gColorsArray);

        // Initialize color nodes
        refreshColors();
    });

    // Set on-click callback for color nodes
    $('.color').click(function(e) { 
        // Convert current bg color of clicked element to HEX
        var ctx = document.createElement('canvas').getContext('2d');
        ctx.strokeStyle = $(this).css('backgroundColor');
        var hexColor = ctx.strokeStyle.toUpperCase();

        // Set all node icons to cross
        $('.color #icon').attr('src', 'cross.png');

        // Set node icon of the test image to tick
        var objId = '#c' + gCurrentContainer + ' #icon';
        $(objId).attr('src', 'tick.png');

        // Check if clicked element is the test image
        var isChoiceRight = 1;
        if(hexColor == gCurrentColor.color)
            gCounter++;
        else {
            gCounter = 0;
            isChoiceRight = 0;
        }

        // Update counter
        setNodeTextMultilang($('#counter'), cCounterTemplate, gCounter);

        // Propagate alert with result
        alert(cMsg[gCurrentLang][isChoiceRight]);

        // Remove cross/tick icons from all nodes
        $('.color #icon').removeAttr('src');

        // Refresh colors
        refreshColors();
    });

    // Set on-click callback for quiz mode
    $('#modeSwitch').click(function(e) {
        var newMode = 0;

        // Calculate new mode
        if ($(this).val() == 0)
            newMode = 1;

        // Reset counter
        gCounter = 0;
        setNodeTextMultilang($('#counter'), cCounterTemplate, gCounter);

        // Set new mode
        $(this).val(newMode);
        setNodeTextMultilang($(this), cModeTemplate, newMode);

        // Refresh colors
        refreshColors();
    });

    // Set on-change callback for language selector
    $(".language select").bind('change', function() {
        // Save language choice
        gCurrentLang = $(".language select").val();

        // Refresh counter
        setNodeTextMultilang($('#counter'), cCounterTemplate, gCounter);

        // Refresh question
        setNodeTextMultilang($('#question'), cQuestionTemplate, gCurrentColor[cNameTemplate + gCurrentLang]);

        // Refresh mode
        setNodeTextMultilang($('#modeSwitch'), cModeTemplate, $('#modeSwitch').val());
    });

    // Set default language
    $(".language select").val(gCurrentLang);

});