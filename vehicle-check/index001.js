// Type aliases (short names)
var printf = KASClient.App.printf;

var _form; // type: KASForm

var _registration = '';
var _tripDate = '';
var _oilLevels = '';
var _radiator = '';
var _clutch = '';
var _fanbelt = '';
var _exhaust = '';
var _fuelTank = '';
var _headlights = '';
var _sideLights = '';
var _indicator = '';
var _plateLights = '';
var _windScreen = '';
var _sideMirrors = '';
var _rearView = '';
var _pressure = '';
var _tread = '';
var _spareWheel = '';
var _jackSpanner = '';
var _firstAid = '';
var _triangles = '';
var _extinguisher = '';
var _radio = '';
var _name = '';
var _phoneNumber = '';
var _currentLocation = {};

var _currentPage = 1;
var _isLocationRefreshing = false;
var _strings = null;
var _currentUserInfo = null;
var _longAddress = '';
var _shortAddress = '';
var _isLocationNotFetched = true;

// constants
var TOTAL_PAGE = 7;
var LOCATION_TIMEOUT = 10000;

// Question index
var REGISTRATION = 0;
var TRIPDATE = 1;
var OIL = 2;
var RADIATOR = 3;
var CLUTCH = 4;
var FANBELT = 5;
var EXHAUST = 6;
var FUELTANK = 7;
var HEADLIGHT = 8;
var SIDELIGHT = 9;
var INDICATOR = 10;
var PLATELIGHTS = 11;
var WINDSCREEN = 12;
var SIDEMIRRORS = 13;
var REARVIEW = 14;
var PRESSURE = 15;
var TREAD = 16;
var SPAREWHEEL = 17;
var JACK = 18;
var FIRSTAID = 19;
var TRIANGLES = 20;
var EXTINGUISHER = 21;
var RADIO = 22;
var NAME = 23;
var PHONE_NUMBER = 24;
var LOCATION = 25;
var TIME = 26;

function onPageLoad() {
  // Register for Android h/w back press event
  KASClient.App.registerHardwareBackPressCallback(function () {
    KASClient.App.dismissCurrentScreen();
  });

  KASClient.App.getLocalizedStringsAsync(function (strings, error) {
    if (error != null) {
      showAlert('Error:GetFormAsync:' + error);
      return;
    }
    _strings = strings;
    KASClient.Form.getFormAsync(function (form, error) {
      if (error != null) {
        showAlert('Error:GetFormAsync:' + error);
        return;
      }
      _form = form;
      inflateHTML();
      inflateQuestions();
      KASClient.App.getCurrentUserIdAsync(function (userId, error) {
        if (error != null) {
          handleError(error);
          return;
        }
        KASClient.App.getUsersDetailsAsync([userId], function (users, error) {
          if (error != null) {
            handleError(error);
            return;
          }
          _currentUserInfo = users[userId];
          _name = _currentUserInfo.originalName;
          _phoneNumber = _currentUserInfo.phoneNumber;
          inflateDetailsView();
        });
      });
    });
  });
}

function refreshLocation() {
  if (_isLocationRefreshing == true) return;

  _isLocationRefreshing = true;
  KASClient.App.getCurrentDeviceLocationAsync(function (location, error) {
    if (error != null) {
      _isLocationRefreshing = false;
      inflateLocationView();
      return;
    }

    _currentLocation = JSON.parse(location);
    fetchAndPopulateAddress();
  });

  setTimeout(function () {
    if (_isLocationRefreshing == true) {
      _isLocationRefreshing = false;
      inflateLocationView();
    }
  }, LOCATION_TIMEOUT);
}

async function submitFormResponse() {
  if (!_currentLocation.hasOwnProperty('lt')) {
    _currentLocation['lt'] = 0.0;
  }

  if (!_currentLocation.hasOwnProperty('lg')) {
    _currentLocation['lg'] = 0.0;
  }

  if (!_currentLocation.hasOwnProperty('n')) {
    _currentLocation['n'] = '';
  }

  var questionToAnswerMap = JSON.parse('{}');

  questionToAnswerMap[REGISTRATION] = _registration;
  questionToAnswerMap[TRIPDATE] = _tripDate;
  questionToAnswerMap[OIL] = _oilLevels;
  questionToAnswerMap[RADIATOR] = _radiator;
  questionToAnswerMap[CLUTCH] = _clutch;
  questionToAnswerMap[FANBELT] = _fanbelt;
  questionToAnswerMap[EXHAUST] = _exhaust;
  questionToAnswerMap[FUELTANK] = _fuelTank;
  questionToAnswerMap[HEADLIGHT] = _headlights;
  questionToAnswerMap[SIDELIGHT] = _sideLights;
  questionToAnswerMap[INDICATOR] = _indicator;
  questionToAnswerMap[PLATELIGHTS] = _plateLights;
  questionToAnswerMap[WINDSCREEN] = _windScreen;
  questionToAnswerMap[SIDEMIRRORS] = _sideMirrors;
  questionToAnswerMap[REARVIEW] = _rearView;
  questionToAnswerMap[PRESSURE] = _pressure;
  questionToAnswerMap[TREAD] = _tread;
  questionToAnswerMap[SPAREWHEEL] = _spareWheel;
  questionToAnswerMap[JACK] = _jackSpanner;
  questionToAnswerMap[FIRSTAID] = _firstAid;
  questionToAnswerMap[TRIANGLES] = _triangles;
  questionToAnswerMap[EXTINGUISHER] = _extinguisher;
  questionToAnswerMap[RADIO] = _radio;
  questionToAnswerMap[NAME] = _name;
  questionToAnswerMap[PHONE_NUMBER] = _phoneNumber;
  questionToAnswerMap[LOCATION] = JSON.stringify(_currentLocation);
  questionToAnswerMap[TIME] = new Date().getTime();

  const registered = await fetch(
    `https://kaizala-fleet.herokuapp.com/vehicle/${_registration}`
  );
  if (registered.status == 400) {
    showError('The vehicle is not registered!');
  } else {
    // Finally submit the response
    KASClient.Form.sumbitFormResponse(
      questionToAnswerMap,
      null,
      false,
      true /* showInChatCanvas */
    );
  }
}

// handling UI
function inflateHTML() {
  // header
  inflateHeader();

  updatePage();
}

function updatePage() {
  for (var i = 1; i <= TOTAL_PAGE; i++) {
    document.getElementById('page' + i).style.display =
      _currentPage == i ? 'block' : 'none';
    document.body.style.backgroundColor =
      _currentPage == TOTAL_PAGE ? '#f2f2f2' : 'white';
  }

  if (_currentPage == 6 && _isLocationNotFetched) {
    _isLocationNotFetched = false;
    refreshLocation();
    inflateLocationView();
  }
  if (_currentPage == TOTAL_PAGE) {
    inflateSummaryView();
  }
  // footer
  inflateFooterView();
}

function inflateHeader() {
  var header = document.getElementById('header');
  KASClient.UI.clearElement(header);

  var navigationBar = new KASClient.UI.KASFormPageNavigationBar();
  navigationBar.backAsset = 'close.png';

  var mainText = KASClient.UI.getElement('div', {
    'font-size': '12pt',
    color: '#32495f',
    'max-width': '300pt',
    'font-weight': '500',
  });
  mainText.innerText = _strings['strMiniAppTitle'];

  navigationBar.title = mainText.outerHTML;

  navigationBar.backAction = function () {
    KASClient.App.dismissCurrentScreen();
  };

  KASClient.UI.addElement(navigationBar.getView(), header);
}

async function inflateRegistrationDiv() {
  var patientType = _form.questions[REGISTRATION];

  var patientTypeDiv = document.getElementById('registerDiv');
  KASClient.UI.clearElement(patientTypeDiv);

  var patientTypeTitle = KASClient.UI.getElement('div');
  patientTypeTitle.className = 'question-title';
  patientTypeTitle.innerText = _strings[patientType.title];
  KASClient.UI.addElement(patientTypeTitle, patientTypeDiv);

  var optionDiv = KASClient.UI.getElement('div');
  optionDiv.className = 'option-div';
  optionDiv.id = 'registerTypeDiv';

  const url = 'https://kaizala-fleet.herokuapp.com/vehicles';

  fetch(url, { method: 'GET' })
    .then((res) => res.json())
    .then((datas) => {
      if (datas) {
        const data = datas.map((item) => item.registrationNo);

        for (let r = 0; r < data.length; r++) {
          var option = data[r];

          var options = KASClient.UI.getElement('div');
          options.className = 'options';
          options.value = option;
          options.onclick = function () {
            _registration = this.value;
            document.getElementById(
              'registerTypeDiv' + _registration
            ).checked = true;
            invalidateFooter();
          };

          var title = KASClient.UI.getElement('label', {
            width: '85%',
            'padding-left': '6pt',
          });
          title.innerText = option;

          var radio = KASClient.getElement('input');
          radio.type = 'radio';
          radio.name = 'registerTypeDiv';
          radio.id = 'registerTypeDiv' + option;

          KASClient.UI.addElement(title, options);
          KASClient.UI.addElement(radio, options);

          KASClient.UI.addElement(options, optionDiv);
        }

        KASClient.UI.addElement(optionDiv, patientTypeDiv);
      } else {
        var title = KASClient.UI.getElement('label', {
          width: '85%',
          'padding-left': '6pt',
        });
        title.innerText = 'No active trip';
        KASClient.UI.addElement(title, options);
        KASClient.UI.addElement(options, optionDiv);
        KASClient.UI.addElement(optionDiv, patientTypeDiv);
      }
    })
    .catch((err) => {
      alert('No registered vehicle!');
    });
}

function inflateTripDateDiv() {
  var textQuestionDiv = document.getElementById('tripDateDiv');
  KASClient.UI.clearElement(textQuestionDiv);

  var textQuestionTitle = KASClient.UI.getElement('div');
  textQuestionTitle.className = 'question-title';
  textQuestionTitle.innerText = _strings[_form.questions[TRIPDATE].title];

  var textQuestionInput = KASClient.UI.getElement('input');
  textQuestionInput.type = 'date';
  textQuestionInput.className = 'comment-input';

  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(textQuestionInput, {
      'padding-left': '13pt',
    });
  }
  textQuestionInput.placeholder = _strings['strTapToEnter'];
  textQuestionInput.addEventListener('input', function (event) {
    _tripDate = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(textQuestionTitle, textQuestionDiv);
  KASClient.UI.addElement(textQuestionInput, textQuestionDiv);
}

function inflateOilPointDiv() {
  var textQuestionDiv = document.getElementById('oilDiv');
  KASClient.UI.clearElement(textQuestionDiv);

  var textQuestionTitle = KASClient.UI.getElement('div');
  textQuestionTitle.className = 'question-title';
  textQuestionTitle.innerText = _strings[_form.questions[OIL].title];

  var textQuestionInput = KASClient.UI.getElement('input');
  textQuestionInput.type = 'text';
  textQuestionInput.className = 'comment-input';

  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(textQuestionInput, {
      'padding-left': '13pt',
    });
  }
  textQuestionInput.placeholder = _strings['strTapToEnter'];
  textQuestionInput.addEventListener('input', function (event) {
    _oilLevels = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(textQuestionTitle, textQuestionDiv);
  KASClient.UI.addElement(textQuestionInput, textQuestionDiv);
}

function inflateRadiatorDiv() {
  var textQuestionDiv = document.getElementById('radiatorDiv');
  KASClient.UI.clearElement(textQuestionDiv);

  var textQuestionTitle = KASClient.UI.getElement('div');
  textQuestionTitle.className = 'question-title';
  textQuestionTitle.innerText = _strings[_form.questions[RADIATOR].title];

  var textQuestionInput = KASClient.UI.getElement('input');
  textQuestionInput.type = 'text';
  textQuestionInput.className = 'comment-input';

  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(textQuestionInput, {
      'padding-left': '13pt',
    });
  }
  textQuestionInput.placeholder = _strings['strTapToEnter'];
  textQuestionInput.addEventListener('input', function (event) {
    _radiator = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(textQuestionTitle, textQuestionDiv);
  KASClient.UI.addElement(textQuestionInput, textQuestionDiv);
}

function inflateClutchDiv() {
  var textQuestionDiv = document.getElementById('clutchDiv');
  KASClient.UI.clearElement(textQuestionDiv);

  var textQuestionTitle = KASClient.UI.getElement('div');
  textQuestionTitle.className = 'question-title';
  textQuestionTitle.innerText = _strings[_form.questions[CLUTCH].title];

  var textQuestionInput = KASClient.UI.getElement('input');
  textQuestionInput.type = 'text';
  textQuestionInput.className = 'comment-input';

  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(textQuestionInput, {
      'padding-left': '13pt',
    });
  }
  textQuestionInput.placeholder = _strings['strTapToEnter'];
  textQuestionInput.addEventListener('input', function (event) {
    _clutch = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(textQuestionTitle, textQuestionDiv);
  KASClient.UI.addElement(textQuestionInput, textQuestionDiv);
}

function inflateFanBeltDiv() {
  var textQuestionDiv = document.getElementById('fanbeltDiv');
  KASClient.UI.clearElement(textQuestionDiv);

  var textQuestionTitle = KASClient.UI.getElement('div');
  textQuestionTitle.className = 'question-title';
  textQuestionTitle.innerText = _strings[_form.questions[FANBELT].title];

  var textQuestionInput = KASClient.UI.getElement('input');
  textQuestionInput.type = 'text';
  textQuestionInput.className = 'comment-input';

  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(textQuestionInput, {
      'padding-left': '13pt',
    });
  }
  textQuestionInput.placeholder = _strings['strTapToEnter'];
  textQuestionInput.addEventListener('input', function (event) {
    _fanbelt = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(textQuestionTitle, textQuestionDiv);
  KASClient.UI.addElement(textQuestionInput, textQuestionDiv);
}

function inflateExhaustDiv() {
  var textQuestionDiv = document.getElementById('exhaustDiv');
  KASClient.UI.clearElement(textQuestionDiv);

  var textQuestionTitle = KASClient.UI.getElement('div');
  textQuestionTitle.className = 'question-title';
  textQuestionTitle.innerText = _strings[_form.questions[EXHAUST].title];

  var textQuestionInput = KASClient.UI.getElement('input');
  textQuestionInput.type = 'text';
  textQuestionInput.className = 'comment-input';

  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(textQuestionInput, {
      'padding-left': '13pt',
    });
  }
  textQuestionInput.placeholder = _strings['strTapToEnter'];
  textQuestionInput.addEventListener('input', function (event) {
    _exhaust = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(textQuestionTitle, textQuestionDiv);
  KASClient.UI.addElement(textQuestionInput, textQuestionDiv);
}

function inflateFuelDiv() {
  var textQuestionDiv = document.getElementById('fuelDiv');
  KASClient.UI.clearElement(textQuestionDiv);

  var textQuestionTitle = KASClient.UI.getElement('div');
  textQuestionTitle.className = 'question-title';
  textQuestionTitle.innerText = _strings[_form.questions[FUELTANK].title];

  var textQuestionInput = KASClient.UI.getElement('input');
  textQuestionInput.type = 'text';
  textQuestionInput.className = 'comment-input';

  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(textQuestionInput, {
      'padding-left': '13pt',
    });
  }
  textQuestionInput.placeholder = _strings['strTapToEnter'];
  textQuestionInput.addEventListener('input', function (event) {
    _fuelTank = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(textQuestionTitle, textQuestionDiv);
  KASClient.UI.addElement(textQuestionInput, textQuestionDiv);
}

// Headlights
function inflateHeadLightDiv() {
  var headlightDiv = document.getElementById('headlightDiv');
  KASClient.UI.clearElement(headlightDiv);

  var headlightTitle = KASClient.UI.getElement('div');
  headlightTitle.className = 'question-title';
  headlightTitle.innerText = _strings[_form.questions[HEADLIGHT].title];

  var headlightInput = KASClient.UI.getElement('input');
  headlightInput.type = 'text';
  headlightInput.className = 'comment-input';

  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(headlightInput, {
      'padding-left': '13pt',
    });
  }
  headlightInput.placeholder = _strings['strTapToEnter'];
  headlightInput.addEventListener('input', function (event) {
    _headlights = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(headlightTitle, headlightDiv);
  KASClient.UI.addElement(headlightInput, headlightDiv);
}

// sidelight
function inflateSideLightDiv() {
  var headlightDiv = document.getElementById('sidelightDiv');
  KASClient.UI.clearElement(headlightDiv);

  var headlightTitle = KASClient.UI.getElement('div');
  headlightTitle.className = 'question-title';
  headlightTitle.innerText = _strings[_form.questions[SIDELIGHT].title];

  var headlightInput = KASClient.UI.getElement('input');
  headlightInput.type = 'text';
  headlightInput.className = 'comment-input';

  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(headlightInput, {
      'padding-left': '13pt',
    });
  }
  headlightInput.placeholder = _strings['strTapToEnter'];
  headlightInput.addEventListener('input', function (event) {
    _sideLights = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(headlightTitle, headlightDiv);
  KASClient.UI.addElement(headlightInput, headlightDiv);
}

// Indicator
function inflateIndicatorDiv() {
  var headlightDiv = document.getElementById('indicatorDiv');
  KASClient.UI.clearElement(headlightDiv);

  var headlightTitle = KASClient.UI.getElement('div');
  headlightTitle.className = 'question-title';
  headlightTitle.innerText = _strings[_form.questions[INDICATOR].title];

  var headlightInput = KASClient.UI.getElement('input');
  headlightInput.type = 'text';
  headlightInput.className = 'comment-input';

  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(headlightInput, {
      'padding-left': '13pt',
    });
  }
  headlightInput.placeholder = _strings['strTapToEnter'];
  headlightInput.addEventListener('input', function (event) {
    _indicator = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(headlightTitle, headlightDiv);
  KASClient.UI.addElement(headlightInput, headlightDiv);
}

// plate lights
function inflatePlateLightsDiv() {
  var headlightDiv = document.getElementById('plateLightDiv');
  KASClient.UI.clearElement(headlightDiv);

  var headlightTitle = KASClient.UI.getElement('div');
  headlightTitle.className = 'question-title';
  headlightTitle.innerText = _strings[_form.questions[PLATELIGHTS].title];

  var headlightInput = KASClient.UI.getElement('input');
  headlightInput.type = 'text';
  headlightInput.className = 'comment-input';

  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(headlightInput, {
      'padding-left': '13pt',
    });
  }
  headlightInput.placeholder = _strings['strTapToEnter'];
  headlightInput.addEventListener('input', function (event) {
    _plateLights = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(headlightTitle, headlightDiv);
  KASClient.UI.addElement(headlightInput, headlightDiv);
}

// Windscreen
function inflateWindScreenDiv() {
  var headlightDiv = document.getElementById('windscreenDiv');
  KASClient.UI.clearElement(headlightDiv);

  var headlightTitle = KASClient.UI.getElement('div');
  headlightTitle.className = 'question-title';
  headlightTitle.innerText = _strings[_form.questions[WINDSCREEN].title];

  var headlightInput = KASClient.UI.getElement('input');
  headlightInput.type = 'text';
  headlightInput.className = 'comment-input';

  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(headlightInput, {
      'padding-left': '13pt',
    });
  }
  headlightInput.placeholder = _strings['strTapToEnter'];
  headlightInput.addEventListener('input', function (event) {
    _windScreen = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(headlightTitle, headlightDiv);
  KASClient.UI.addElement(headlightInput, headlightDiv);
}

// side Mirrors
function inflateSideMirrorsDiv() {
  var headlightDiv = document.getElementById('sideMirrorsDiv');
  KASClient.UI.clearElement(headlightDiv);

  var headlightTitle = KASClient.UI.getElement('div');
  headlightTitle.className = 'question-title';
  headlightTitle.innerText = _strings[_form.questions[SIDEMIRRORS].title];

  var headlightInput = KASClient.UI.getElement('input');
  headlightInput.type = 'text';
  headlightInput.className = 'comment-input';

  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(headlightInput, {
      'padding-left': '13pt',
    });
  }
  headlightInput.placeholder = _strings['strTapToEnter'];
  headlightInput.addEventListener('input', function (event) {
    _sideMirrors = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(headlightTitle, headlightDiv);
  KASClient.UI.addElement(headlightInput, headlightDiv);
}

// Rear View Mirror
function inflateRearViewDiv() {
  var headlightDiv = document.getElementById('rearViewDiv');
  KASClient.UI.clearElement(headlightDiv);

  var headlightTitle = KASClient.UI.getElement('div');
  headlightTitle.className = 'question-title';
  headlightTitle.innerText = _strings[_form.questions[REARVIEW].title];

  var headlightInput = KASClient.UI.getElement('input');
  headlightInput.type = 'text';
  headlightInput.className = 'comment-input';

  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(headlightInput, {
      'padding-left': '13pt',
    });
  }
  headlightInput.placeholder = _strings['strTapToEnter'];
  headlightInput.addEventListener('input', function (event) {
    _rearView = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(headlightTitle, headlightDiv);
  KASClient.UI.addElement(headlightInput, headlightDiv);
}

// Pressure
function inflatePressureDiv() {
  var headlightDiv = document.getElementById('pressureDiv');
  KASClient.UI.clearElement(headlightDiv);

  var headlightTitle = KASClient.UI.getElement('div');
  headlightTitle.className = 'question-title';
  headlightTitle.innerText = _strings[_form.questions[PRESSURE].title];

  var headlightInput = KASClient.UI.getElement('input');
  headlightInput.type = 'text';
  headlightInput.className = 'comment-input';

  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(headlightInput, {
      'padding-left': '13pt',
    });
  }
  headlightInput.placeholder = _strings['strTapToEnter'];
  headlightInput.addEventListener('input', function (event) {
    _pressure = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(headlightTitle, headlightDiv);
  KASClient.UI.addElement(headlightInput, headlightDiv);
}

// Tread
function inflateTreadDiv() {
  var headlightDiv = document.getElementById('treadDiv');
  KASClient.UI.clearElement(headlightDiv);

  var headlightTitle = KASClient.UI.getElement('div');
  headlightTitle.className = 'question-title';
  headlightTitle.innerText = _strings[_form.questions[TREAD].title];

  var headlightInput = KASClient.UI.getElement('input');
  headlightInput.type = 'text';
  headlightInput.className = 'comment-input';

  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(headlightInput, {
      'padding-left': '13pt',
    });
  }
  headlightInput.placeholder = _strings['strTapToEnter'];
  headlightInput.addEventListener('input', function (event) {
    _tread = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(headlightTitle, headlightDiv);
  KASClient.UI.addElement(headlightInput, headlightDiv);
}

// Spare Wheel
function inflateSpareWheelDiv() {
  var headlightDiv = document.getElementById('spareWheelDiv');
  KASClient.UI.clearElement(headlightDiv);

  var headlightTitle = KASClient.UI.getElement('div');
  headlightTitle.className = 'question-title';
  headlightTitle.innerText = _strings[_form.questions[SPAREWHEEL].title];

  var headlightInput = KASClient.UI.getElement('input');
  headlightInput.type = 'text';
  headlightInput.className = 'comment-input';

  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(headlightInput, {
      'padding-left': '13pt',
    });
  }
  headlightInput.placeholder = _strings['strTapToEnter'];
  headlightInput.addEventListener('input', function (event) {
    _spareWheel = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(headlightTitle, headlightDiv);
  KASClient.UI.addElement(headlightInput, headlightDiv);
}

// Jack and Spanner
function inflateJackAndSpannerDiv() {
  var headlightDiv = document.getElementById('jackSpannerDiv');
  KASClient.UI.clearElement(headlightDiv);

  var headlightTitle = KASClient.UI.getElement('div');
  headlightTitle.className = 'question-title';
  headlightTitle.innerText = _strings[_form.questions[JACK].title];

  var headlightInput = KASClient.UI.getElement('input');
  headlightInput.type = 'text';
  headlightInput.className = 'comment-input';

  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(headlightInput, {
      'padding-left': '13pt',
    });
  }
  headlightInput.placeholder = _strings['strTapToEnter'];
  headlightInput.addEventListener('input', function (event) {
    _jackSpanner = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(headlightTitle, headlightDiv);
  KASClient.UI.addElement(headlightInput, headlightDiv);
}

// First Aid
function inflateFirstAidDiv() {
  var headlightDiv = document.getElementById('firstAidDiv');
  KASClient.UI.clearElement(headlightDiv);

  var headlightTitle = KASClient.UI.getElement('div');
  headlightTitle.className = 'question-title';
  headlightTitle.innerText = _strings[_form.questions[FIRSTAID].title];

  var headlightInput = KASClient.UI.getElement('input');
  headlightInput.type = 'text';
  headlightInput.className = 'comment-input';

  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(headlightInput, {
      'padding-left': '13pt',
    });
  }
  headlightInput.placeholder = _strings['strTapToEnter'];
  headlightInput.addEventListener('input', function (event) {
    _firstAid = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(headlightTitle, headlightDiv);
  KASClient.UI.addElement(headlightInput, headlightDiv);
}

// Triangles
function inflateTrianglesDiv() {
  var headlightDiv = document.getElementById('trianglesDiv');
  KASClient.UI.clearElement(headlightDiv);

  var headlightTitle = KASClient.UI.getElement('div');
  headlightTitle.className = 'question-title';
  headlightTitle.innerText = _strings[_form.questions[TRIANGLES].title];

  var headlightInput = KASClient.UI.getElement('input');
  headlightInput.type = 'text';
  headlightInput.className = 'comment-input';

  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(headlightInput, {
      'padding-left': '13pt',
    });
  }
  headlightInput.placeholder = _strings['strTapToEnter'];
  headlightInput.addEventListener('input', function (event) {
    _triangles = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(headlightTitle, headlightDiv);
  KASClient.UI.addElement(headlightInput, headlightDiv);
}

// Extinguisher
function inflateExtinguisherDiv() {
  var headlightDiv = document.getElementById('extinguisherDiv');
  KASClient.UI.clearElement(headlightDiv);

  var headlightTitle = KASClient.UI.getElement('div');
  headlightTitle.className = 'question-title';
  headlightTitle.innerText = _strings[_form.questions[EXTINGUISHER].title];

  var headlightInput = KASClient.UI.getElement('input');
  headlightInput.type = 'text';
  headlightInput.className = 'comment-input';

  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(headlightInput, {
      'padding-left': '13pt',
    });
  }
  headlightInput.placeholder = _strings['strTapToEnter'];
  headlightInput.addEventListener('input', function (event) {
    _extinguisher = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(headlightTitle, headlightDiv);
  KASClient.UI.addElement(headlightInput, headlightDiv);
}

// Radio
function inflateRadioDiv() {
  var headlightDiv = document.getElementById('radioDiv');
  KASClient.UI.clearElement(headlightDiv);

  var headlightTitle = KASClient.UI.getElement('div');
  headlightTitle.className = 'question-title';
  headlightTitle.innerText = _strings[_form.questions[RADIO].title];

  var headlightInput = KASClient.UI.getElement('input');
  headlightInput.type = 'text';
  headlightInput.className = 'comment-input';

  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(headlightInput, {
      'padding-left': '13pt',
    });
  }
  headlightInput.placeholder = _strings['strTapToEnter'];
  headlightInput.addEventListener('input', function (event) {
    _radio = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(headlightTitle, headlightDiv);
  KASClient.UI.addElement(headlightInput, headlightDiv);
}

function inflateQuestions() {
  inflateRegistrationDiv();

  inflateTripDateDiv();

  inflateOilPointDiv();

  inflateRadiatorDiv();

  inflateClutchDiv();

  inflateFanBeltDiv();

  inflateExhaustDiv();

  inflateFuelDiv();

  inflateHeadLightDiv();

  inflateSideLightDiv();

  inflateIndicatorDiv();

  inflatePlateLightsDiv();

  inflateWindScreenDiv();

  inflateSideMirrorsDiv();

  inflateRearViewDiv();

  inflatePressureDiv();

  inflateTreadDiv();

  inflateSpareWheelDiv();

  inflateJackAndSpannerDiv();

  inflateFirstAidDiv();

  inflateTrianglesDiv();

  inflateExtinguisherDiv();

  inflateRadioDiv();
}

function inflateDetailsView() {
  // 2nd Page

  var detailsViewDiv = document.getElementById('detailsViewDiv');
  KASClient.UI.clearElement(detailsViewDiv);

  // show details view
  var showDetailsView = KASClient.UI.getElement('div', {
    display: 'block',
  });

  var showDetailsViewName = KASClient.UI.getElement('div');
  showDetailsViewName.className = 'section';

  var showDetailsViewNameHeader = KASClient.UI.getElement('p');
  showDetailsViewNameHeader.className = 'comment-header';
  showDetailsViewNameHeader.innerText = _strings[_form.questions[NAME].title];

  var showDetailsViewNameInput = KASClient.UI.getElement('input');
  showDetailsViewNameInput.type = 'text';
  showDetailsViewNameInput.className = 'comment-input';
  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(showDetailsViewNameInput, {
      'padding-left': '13pt',
    });
  }
  showDetailsViewNameInput.placeholder = _strings[_form.questions[NAME].title];
  showDetailsViewNameInput.value = _name;
  showDetailsViewNameInput.addEventListener('input', function (event) {
    _name = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(showDetailsViewNameHeader, showDetailsViewName);
  KASClient.UI.addElement(showDetailsViewNameInput, showDetailsViewName);

  var showDetailsViewPhone = KASClient.UI.getElement('div', {
    'border-bottom': 'none',
  });
  showDetailsViewPhone.className = 'section';

  var showDetailsViewPhoneHeader = KASClient.UI.getElement('p');
  showDetailsViewPhoneHeader.className = 'comment-header';
  showDetailsViewPhoneHeader.innerText =
    _strings[_form.questions[PHONE_NUMBER].title];

  var showDetailsViewPhoneInput = KASClient.UI.getElement('input', {
    'border-bottom': 'none',
  });
  showDetailsViewPhoneInput.type = 'tel';
  showDetailsViewPhoneInput.className = 'comment-input';
  if (KASClient.getPlatform() == KASClient.Platform.iOS) {
    KASClient.UI.addCSS(showDetailsViewPhoneInput, {
      'padding-left': '13pt',
    });
  }
  showDetailsViewPhoneInput.placeholder = _phoneNumber;
  showDetailsViewPhoneInput.readOnly = true;
  showDetailsViewPhoneInput.addEventListener('input', function (event) {
    _phoneNumber = event.target.value;
    invalidateFooter();
  });

  KASClient.UI.addElement(showDetailsViewPhoneHeader, showDetailsViewPhone);
  KASClient.UI.addElement(showDetailsViewPhoneInput, showDetailsViewPhone);

  KASClient.UI.addElement(showDetailsViewName, showDetailsView);
  KASClient.UI.addElement(showDetailsViewPhone, showDetailsView);

  KASClient.UI.addElement(showDetailsView, detailsViewDiv);
}

function inflateLocationView() {
  var locationViewDiv = document.getElementById('locationViewDiv');
  KASClient.UI.clearElement(locationViewDiv);

  // location view header
  var locationHeader = KASClient.UI.getElement('div');
  locationHeader.className = 'location-title';
  locationHeader.innerText = _strings[_form.questions[LOCATION].title];

  //location map view
  var locationMapView = KASClient.UI.getElement('img');
  if (
    _currentLocation.hasOwnProperty('lt') == true &&
    _currentLocation.hasOwnProperty('lg') == true
  ) {
    locationMapView.src =
      'https://maps.googleapis.com/maps/api/staticmap?zoom=18&size=360x170&maptype=roadmap&markers=color:blue%7C%7C' +
      _currentLocation['lt'] +
      ',' +
      _currentLocation['lg'];
  } else {
    locationMapView.style.display = 'none';
  }
  locationMapView.className = 'location-image';
  locationMapView.onerror = function (event) {
    event.target.style.display = 'none';
  };

  // location address-refresh div
  var locationAddressRefreshDiv = KASClient.UI.getElement('div', {
    padding: '15pt',
    'padding-top': '8px',
    display: 'inline-flex',
  });

  var locationAddressDiv = KASClient.UI.getElement('div', {
    float: 'left',
    display: 'flex',
    'flex-direction': 'column',
    width: '100%',
  });

  // low network  warning text
  var locationNetworkWarning = KASClient.UI.getElement('label', {
    color: '#6f7e8f',
    'font-size': '9pt',
    display: 'none',
  });

  // main address text
  var locationAddress = KASClient.UI.getElement('label');
  locationAddress.className = 'location-address';

  if (
    !(
      _currentLocation.hasOwnProperty('lt') == true &&
      _currentLocation.hasOwnProperty('lg') == true
    )
  ) {
    if (!_isLocationRefreshing) {
      locationNetworkWarning.style.display = 'block';
      locationNetworkWarning.innerText = _strings['strNoLocationAlertLabel'];
    } else {
      locationNetworkWarning.style.display = 'none';
      locationAddress.innerText = _strings['strMiniAppLoadingLabel'];
    }
  } else {
    if (_longAddress == '' && _shortAddress == '') {
      locationNetworkWarning.style.display = 'block';
      locationAddress.innerText =
        _currentLocation['lt'] + ', ' + _currentLocation['lg'];
      locationNetworkWarning.innerText =
        _strings['strMiniAppLocationNetworkWarningLabel'];
    } else {
      locationAddress.innerText =
        _longAddress == '' ? _shortAddress : _longAddress;
    }
  }
  _currentLocation['n'] = locationAddress.innerText;

  KASClient.UI.addElement(locationAddress, locationAddressDiv);
  KASClient.UI.addElement(locationNetworkWarning, locationAddressDiv);

  // refresh button
  var refreshImg = KASClient.UI.getElement('img');
  refreshImg.src = 'refresh.png';

  // refresh label
  var refreshLabel = KASClient.UI.getElement('label', {
    'font-size': '9pt',
    color: '#006ff1',
    'font-weight': 'bold',
  });
  refreshLabel.innerText = _strings['strRefreshLabel'];

  var refreshDiv = KASClient.UI.getElement('div', {
    float: 'right',
    display: 'flex',
    'flex-direction': 'column',
    'text-align': 'right',
    'justify-content': 'flex-end',
    'margin-left': '4pt',
    'min-width': '50pt',
  });

  refreshDiv.addEventListener('click', function () {
    refreshLocation();
    inflateLocationView();
  });

  if (!_isLocationRefreshing) {
    refreshLabel.style.display = 'block';
    refreshImg.style.display = 'none';

    refreshImg.className = 'refresh-img';
  } else {
    refreshLabel.style.display = 'none';
    refreshImg.style.display = 'block';

    refreshImg.className = 'refresh-img-selected';
  }

  KASClient.UI.addElement(refreshImg, refreshDiv);
  KASClient.UI.addElement(refreshLabel, refreshDiv);

  KASClient.UI.addElement(locationAddressDiv, locationAddressRefreshDiv);
  KASClient.UI.addElement(refreshDiv, locationAddressRefreshDiv);

  KASClient.UI.addElement(locationHeader, locationViewDiv);
  KASClient.UI.addElement(locationMapView, locationViewDiv);
  KASClient.UI.addElement(locationAddressRefreshDiv, locationViewDiv);

  invalidateFooter();

  if (_currentPage == TOTAL_PAGE) {
    inflateSummaryView();
  }
}

function invalidateFooter() {
  inflateFooterView();
}

function inflateFooterView() {
  var footer = document.getElementById('footer');
  KASClient.UI.clearElement(footer);

  // setting footer view background
  KASClient.UI.addCSS(footer, {
    'background-image':
      _currentPage == TOTAL_PAGE
        ? "url('footer_bg_3.png')"
        : "url('footer_bg.png')",
  });

  // Previous button
  var prevButton = KASClient.UI.getElement('input');
  prevButton.type = 'submit';
  prevButton.className = 'footer-action-previous';
  prevButton.value = '';
  prevButton.disabled = _currentPage == 1;
  if (
    KASClient.getPlatform() == KASClient.Platform.Android &&
    prevButton.disabled
  ) {
    KASClient.UI.addCSS(prevButton, {
      border: '1px solid rgba(227, 230, 233, 0.5)',
    });
  }
  prevButton.addEventListener('click', function () {
    _currentPage -= 1;

    updatePage();
    document.body.scrollTop = 0;
  });

  // Progress view
  var progressDiv = KASClient.UI.getElement('div', {
    display: 'flex',
    'align-items': 'center',
  });

  progressDiv.className = 'footer-action';

  var progressInnerDiv = KASClient.UI.getElement('div', {
    width: '100%',
  });

  var progressText = KASClient.UI.getElement('div', {
    width: '100%',
    'text-align': 'center',
    'padding-bottom': '3pt',
    'font-size': '11pt',
    color: 'black',
    'font-weight': '500',
  });

  progressText.innerText = printf(
    _strings['strProgressTextLabel'],
    _currentPage,
    TOTAL_PAGE
  );

  var progressBarOuterDiv = KASClient.UI.getElement('div', {
    width: '80%',
    height: '2pt',
    'background-color': 'rgba(152, 163, 175, .25)',
    'margin-left': '10%',
  });

  var progressBarInnerDiv = KASClient.UI.getElement('div', {
    width: '' + (_currentPage * 100) / TOTAL_PAGE + '%',
    height: '100%',
    'background-color': 'rgb(253, 158, 40)',
  });

  KASClient.UI.addElement(progressBarInnerDiv, progressBarOuterDiv);

  KASClient.UI.addElement(progressText, progressInnerDiv);
  KASClient.UI.addElement(progressBarOuterDiv, progressInnerDiv);

  KASClient.UI.addElement(progressInnerDiv, progressDiv);

  // Next button
  var nextBgColor = _currentPage == TOTAL_PAGE ? '#5ad7a4' : '#00a1ff';
  var nextButton = KASClient.UI.getElement('input', {
    'background-color': nextBgColor,
  });
  nextButton.type = 'submit';
  nextButton.className =
    _currentPage == TOTAL_PAGE ? 'footer-action-send' : 'footer-action-next';
  nextButton.value =
    _currentPage == TOTAL_PAGE ? _strings['strSendResponseLabel'] : '';
  var nextButtonIsDisabled = false;

  if (_currentPage == 1) {
    if (
      _registration == '' ||
      _tripDate == '' ||
      _oilLevels == '' ||
      _radiator == '' ||
      _clutch == '' ||
      _fanbelt == '' ||
      _exhaust == '' ||
      _fuelTank == ''
    ) {
      nextButtonIsDisabled = true;
    }
  } else if (_currentPage == 2) {
    if (
      _headlights == '' ||
      _sideLights == '' ||
      _indicator == '' ||
      _plateLights == ''
    ) {
      nextButtonIsDisabled = true;
    }
  } else if (_currentPage == 3) {
    if (_windScreen == '' || _sideMirrors == '' || _rearView == '') {
      nextButtonIsDisabled = true;
    }
  } else if (_currentPage == 4) {
    if (
      _pressure == '' ||
      _tread == '' ||
      _spareWheel == '' ||
      _jackSpanner == ''
    ) {
      nextButtonIsDisabled = true;
    }
  } else if (_currentPage == 5) {
    if (
      _firstAid == '' ||
      _triangles == '' ||
      _extinguisher == '' ||
      _radio == ''
    ) {
      nextButtonIsDisabled = true;
    }
  } else if (_currentPage == 6) {
    if (_name == '' || _phoneNumber == '') {
      nextButtonIsDisabled = true;
    }
    if (_isLocationRefreshing) {
      nextButtonIsDisabled = true;
    }
  }

  nextButton.disabled = nextButtonIsDisabled;
  if (
    KASClient.getPlatform() == KASClient.Platform.Android &&
    nextButton.disabled
  ) {
    KASClient.UI.addCSS(nextButton, {
      'background-color': 'rgb(155, 218, 253)',
    });
  }
  nextButton.addEventListener('click', function () {
    if (_currentPage != TOTAL_PAGE) {
      _currentPage += 1;
      updatePage();
      document.body.scrollTop = 0;
    } else {
      submitFormResponse();
    }
  });

  KASClient.UI.addElement(prevButton, footer);
  KASClient.UI.addElement(progressDiv, footer);
  KASClient.UI.addElement(nextButton, footer);
}

function inflateSummaryView() {
  var summaryView = document.getElementById('page7');
  KASClient.UI.clearElement(summaryView);

  var divAttributes = {
    'background-color': 'white',
    color: '#32485f',
    'font-size': '13.5pt',
    margin: '16px',
    'margin-top': '8px',
    'margin-bottom': '8px',
    'box-shadow': '0px 0px 1px 0px rgba(0,0,0,0.12)',
    'border-radius': '4px',
  };

  var textQuestionDetailsDiv = KASClient.UI.getElement('div', divAttributes);

  var textQuestionDetailsHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });

  textQuestionDetailsHeader.className = 'comment-header';
  textQuestionDetailsHeader.innerText =
    _strings[_form.questions[REGISTRATION].title];
  KASClient.UI.addElement(textQuestionDetailsHeader, textQuestionDetailsDiv);

  var textQuestionDetailsView = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-top': '5pt',
  });

  var textQuestion = KASClient.UI.getElement('div', {
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  textQuestion.innerHTML = _registration;

  KASClient.UI.addElement(textQuestion, textQuestionDetailsView);
  KASClient.UI.addElement(textQuestionDetailsView, textQuestionDetailsDiv);

  var startingTripDiv = KASClient.UI.getElement('div', divAttributes);

  var startingTripHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });

  startingTripHeader.className = 'comment-header';
  startingTripHeader.innerText = _strings[_form.questions[TRIPDATE].title];
  KASClient.UI.addElement(startingTripHeader, startingTripDiv);

  var startingTripView = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-top': '5pt',
  });

  var startingTrip = KASClient.UI.getElement('div', {
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  startingTrip.innerHTML = _tripDate;

  KASClient.UI.addElement(startingTrip, startingTripView);
  KASClient.UI.addElement(startingTripView, startingTripDiv);

  var dateDiv = KASClient.UI.getElement('div', divAttributes);

  var dateHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });

  dateHeader.className = 'comment-header';
  dateHeader.innerText = _strings[_form.questions[OIL].title];
  KASClient.UI.addElement(dateHeader, dateDiv);

  var dateView = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-top': '5pt',
  });

  var date = KASClient.UI.getElement('div', {
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  date.innerHTML = _oilLevels;

  KASClient.UI.addElement(date, dateView);
  KASClient.UI.addElement(dateView, dateDiv);

  var startTimeDiv = KASClient.UI.getElement('div', divAttributes);

  var startTimeHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });

  startTimeHeader.className = 'comment-header';
  startTimeHeader.innerText = _strings[_form.questions[RADIATOR].title];
  KASClient.UI.addElement(startTimeHeader, startTimeDiv);

  var startTimeView = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-top': '5pt',
  });

  var startTime = KASClient.UI.getElement('div', {
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  startTime.innerHTML = _radiator;

  KASClient.UI.addElement(startTime, startTimeView);
  KASClient.UI.addElement(startTimeView, startTimeDiv);

  var clutchDiv = KASClient.UI.getElement('div', divAttributes);

  var clutchHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });

  clutchHeader.className = 'comment-header';
  clutchHeader.innerText = _strings[_form.questions[CLUTCH].title];
  KASClient.UI.addElement(clutchHeader, clutchDiv);

  var clutchView = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-top': '5pt',
  });

  var clutch = KASClient.UI.getElement('div', {
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  clutch.innerHTML = _clutch;

  KASClient.UI.addElement(clutch, clutchView);
  KASClient.UI.addElement(clutchView, clutchDiv);

  var fanBeltDiv = KASClient.UI.getElement('div', divAttributes);

  var fanBeltHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });

  fanBeltHeader.className = 'comment-header';
  fanBeltHeader.innerText = _strings[_form.questions[FANBELT].title];
  KASClient.UI.addElement(fanBeltHeader, fanBeltDiv);

  var fanBeltView = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-top': '5pt',
  });

  var fanBelt = KASClient.UI.getElement('div', {
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  fanBelt.innerHTML = _fanbelt;

  KASClient.UI.addElement(fanBelt, fanBeltView);
  KASClient.UI.addElement(fanBeltView, fanBeltDiv);

  var exhaustPipeDiv = KASClient.UI.getElement('div', divAttributes);

  var exhaustPipeHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });

  exhaustPipeHeader.className = 'comment-header';
  exhaustPipeHeader.innerText = _strings[_form.questions[EXHAUST].title];
  KASClient.UI.addElement(exhaustPipeHeader, exhaustPipeDiv);

  var exhaustPipeView = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-top': '5pt',
  });

  var exhaustPipe = KASClient.UI.getElement('div', {
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  exhaustPipe.innerHTML = _exhaust;

  KASClient.UI.addElement(exhaustPipe, exhaustPipeView);
  KASClient.UI.addElement(exhaustPipeView, exhaustPipeDiv);

  var fuelTankDiv = KASClient.UI.getElement('div', divAttributes);

  var fuelTankHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });

  fuelTankHeader.className = 'comment-header';
  fuelTankHeader.innerText = _strings[_form.questions[FUELTANK].title];
  KASClient.UI.addElement(fuelTankHeader, fuelTankDiv);

  var fuelTankView = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-top': '5pt',
  });

  var fuelTank = KASClient.UI.getElement('div', {
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  fuelTank.innerHTML = _fuelTank;

  KASClient.UI.addElement(fuelTank, fuelTankView);
  KASClient.UI.addElement(fuelTankView, fuelTankDiv);

  var headLightsDiv = KASClient.UI.getElement('div', divAttributes);

  var headLightsHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });

  headLightsHeader.className = 'comment-header';
  headLightsHeader.innerText = _strings[_form.questions[HEADLIGHT].title];
  KASClient.UI.addElement(headLightsHeader, headLightsDiv);

  var headLightsView = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-top': '5pt',
  });

  var headLights = KASClient.UI.getElement('div', {
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  headLights.innerHTML = _headlights;

  KASClient.UI.addElement(headLights, headLightsView);
  KASClient.UI.addElement(headLightsView, headLightsDiv);

  var sidelightsDiv = KASClient.UI.getElement('div', divAttributes);

  var sidelightsHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });

  sidelightsHeader.className = 'comment-header';
  sidelightsHeader.innerText = _strings[_form.questions[SIDELIGHT].title];
  KASClient.UI.addElement(sidelightsHeader, sidelightsDiv);

  var sidelightsView = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-top': '5pt',
  });

  var sidelights = KASClient.UI.getElement('div', {
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  sidelights.innerHTML = _sideLights;

  KASClient.UI.addElement(sidelights, sidelightsView);
  KASClient.UI.addElement(sidelightsView, sidelightsDiv);

  var indicatorLightsDiv = KASClient.UI.getElement('div', divAttributes);

  var indicatorLightsHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });

  indicatorLightsHeader.className = 'comment-header';
  indicatorLightsHeader.innerText = _strings[_form.questions[INDICATOR].title];
  KASClient.UI.addElement(indicatorLightsHeader, indicatorLightsDiv);

  var indicatorLightsView = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-top': '5pt',
  });

  var indicatorLights = KASClient.UI.getElement('div', {
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  indicatorLights.innerHTML = _indicator;

  KASClient.UI.addElement(indicatorLights, indicatorLightsView);
  KASClient.UI.addElement(indicatorLightsView, indicatorLightsDiv);

  var plateLightsDiv = KASClient.UI.getElement('div', divAttributes);

  var plateLightsHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });

  plateLightsHeader.className = 'comment-header';
  plateLightsHeader.innerText = _strings[_form.questions[PLATELIGHTS].title];
  KASClient.UI.addElement(plateLightsHeader, plateLightsDiv);

  var plateLightsView = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-top': '5pt',
  });

  var plateLights = KASClient.UI.getElement('div', {
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  plateLights.innerHTML = _plateLights;

  KASClient.UI.addElement(plateLights, plateLightsView);
  KASClient.UI.addElement(plateLightsView, plateLightsDiv);

  var windScreenDiv = KASClient.UI.getElement('div', divAttributes);

  var windScreenHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });

  windScreenHeader.className = 'comment-header';
  windScreenHeader.innerText = _strings[_form.questions[WINDSCREEN].title];
  KASClient.UI.addElement(windScreenHeader, windScreenDiv);

  var windScreenView = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-top': '5pt',
  });

  var windScreen = KASClient.UI.getElement('div', {
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  windScreen.innerHTML = _windScreen;

  KASClient.UI.addElement(windScreen, windScreenView);
  KASClient.UI.addElement(windScreenView, windScreenDiv);

  var sideMorrorsDiv = KASClient.UI.getElement('div', divAttributes);

  var sideMorrorsHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });

  sideMorrorsHeader.className = 'comment-header';
  sideMorrorsHeader.innerText = _strings[_form.questions[SIDEMIRRORS].title];
  KASClient.UI.addElement(sideMorrorsHeader, sideMorrorsDiv);

  var sideMorrorsView = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-top': '5pt',
  });

  var sideMorrors = KASClient.UI.getElement('div', {
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  sideMorrors.innerHTML = _sideMirrors;

  KASClient.UI.addElement(sideMorrors, sideMorrorsView);
  KASClient.UI.addElement(sideMorrorsView, sideMorrorsDiv);

  var rearViewDiv = KASClient.UI.getElement('div', divAttributes);

  var rearViewHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });

  rearViewHeader.className = 'comment-header';
  rearViewHeader.innerText = _strings[_form.questions[REARVIEW].title];
  KASClient.UI.addElement(rearViewHeader, rearViewDiv);

  var rearViewView = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-top': '5pt',
  });

  var rearView = KASClient.UI.getElement('div', {
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  rearView.innerHTML = _rearView;

  KASClient.UI.addElement(rearView, rearViewView);
  KASClient.UI.addElement(rearViewView, rearViewDiv);

  var pressureDiv = KASClient.UI.getElement('div', divAttributes);

  var pressureHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });

  pressureHeader.className = 'comment-header';
  pressureHeader.innerText = _strings[_form.questions[PRESSURE].title];
  KASClient.UI.addElement(pressureHeader, pressureDiv);

  var pressureView = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-top': '5pt',
  });

  var pressure = KASClient.UI.getElement('div', {
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  pressure.innerHTML = _pressure;

  KASClient.UI.addElement(pressure, pressureView);
  KASClient.UI.addElement(pressureView, pressureDiv);

  var treadDiv = KASClient.UI.getElement('div', divAttributes);

  var treadHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });

  treadHeader.className = 'comment-header';
  treadHeader.innerText = _strings[_form.questions[TREAD].title];
  KASClient.UI.addElement(treadHeader, treadDiv);

  var treadView = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-top': '5pt',
  });

  var tread = KASClient.UI.getElement('div', {
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  tread.innerHTML = _tread;

  KASClient.UI.addElement(tread, treadView);
  KASClient.UI.addElement(treadView, treadDiv);

  var spareWheelDiv = KASClient.UI.getElement('div', divAttributes);

  var spareWheelHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });

  spareWheelHeader.className = 'comment-header';
  spareWheelHeader.innerText = _strings[_form.questions[SPAREWHEEL].title];
  KASClient.UI.addElement(spareWheelHeader, spareWheelDiv);

  var spareWheelView = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-top': '5pt',
  });

  var spareWheel = KASClient.UI.getElement('div', {
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  spareWheel.innerHTML = _spareWheel;

  KASClient.UI.addElement(spareWheel, spareWheelView);
  KASClient.UI.addElement(spareWheelView, spareWheelDiv);

  var jackSpannerDiv = KASClient.UI.getElement('div', divAttributes);

  var jackSpannerHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });

  jackSpannerHeader.className = 'comment-header';
  jackSpannerHeader.innerText = _strings[_form.questions[JACK].title];
  KASClient.UI.addElement(jackSpannerHeader, jackSpannerDiv);

  var jackSpannerView = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-top': '5pt',
  });

  var jackSpanner = KASClient.UI.getElement('div', {
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  jackSpanner.innerHTML = _jackSpanner;

  KASClient.UI.addElement(jackSpanner, jackSpannerView);
  KASClient.UI.addElement(jackSpannerView, jackSpannerDiv);

  var firstAidDiv = KASClient.UI.getElement('div', divAttributes);

  var firstAidHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });

  firstAidHeader.className = 'comment-header';
  firstAidHeader.innerText = _strings[_form.questions[FIRSTAID].title];
  KASClient.UI.addElement(firstAidHeader, firstAidDiv);

  var firstAidView = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-top': '5pt',
  });

  var firstAid = KASClient.UI.getElement('div', {
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  firstAid.innerHTML = _firstAid;

  KASClient.UI.addElement(firstAid, firstAidView);
  KASClient.UI.addElement(firstAidView, firstAidDiv);

  var trianglesDiv = KASClient.UI.getElement('div', divAttributes);

  var trianglesHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });

  trianglesHeader.className = 'comment-header';
  trianglesHeader.innerText = _strings[_form.questions[TRIANGLES].title];
  KASClient.UI.addElement(trianglesHeader, trianglesDiv);

  var trianglesView = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-top': '5pt',
  });

  var triangles = KASClient.UI.getElement('div', {
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  triangles.innerHTML = _triangles;

  KASClient.UI.addElement(triangles, trianglesView);
  KASClient.UI.addElement(trianglesView, trianglesDiv);

  var ExtinguisherDiv = KASClient.UI.getElement('div', divAttributes);

  var ExtinguisherHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });

  ExtinguisherHeader.className = 'comment-header';
  ExtinguisherHeader.innerText = _strings[_form.questions[EXTINGUISHER].title];
  KASClient.UI.addElement(ExtinguisherHeader, ExtinguisherDiv);

  var ExtinguisherView = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-top': '5pt',
  });

  var Extinguisher = KASClient.UI.getElement('div', {
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  Extinguisher.innerHTML = _extinguisher;

  KASClient.UI.addElement(Extinguisher, ExtinguisherView);
  KASClient.UI.addElement(ExtinguisherView, ExtinguisherDiv);

  var radioDiv = KASClient.UI.getElement('div', divAttributes);

  var radioHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });

  radioHeader.className = 'comment-header';
  radioHeader.innerText = _strings[_form.questions[RADIO].title];
  KASClient.UI.addElement(radioHeader, radioDiv);

  var radioView = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-top': '5pt',
  });

  var radio = KASClient.UI.getElement('div', {
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  radio.innerHTML = _radio;

  KASClient.UI.addElement(radio, radioView);
  KASClient.UI.addElement(radioView, radioDiv);

  // Personal Details Summary
  var detailsDiv = KASClient.UI.getElement('div', divAttributes);

  var detailsHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });
  detailsHeader.className = 'comment-header';
  detailsHeader.innerText = _strings['strMiniAppYourDetails'];
  KASClient.UI.addElement(detailsHeader, detailsDiv);

  var details = KASClient.UI.getElement('table', {
    border: 'none',
    padding: '14px',
    'padding-top': '5pt',
    color: '#32485f',
    'font-size': '12pt',
    'overflow-wrap': 'break-word',
    'word-wrap': 'break-word',
    'word-break': 'break-word',
  });

  var row1 = details.insertRow(0);
  var cell11 = row1.insertCell(0);
  var cell12 = row1.insertCell(1);
  cell11.className = 'first-column';
  cell11.innerHTML = _strings[_form.questions[NAME].title];
  cell12.innerHTML = ': ' + _name;

  var row2 = details.insertRow(1);
  var cell21 = row2.insertCell(0);
  var cell22 = row2.insertCell(1);
  cell21.className = 'first-column';
  cell21.innerHTML = _strings[_form.questions[PHONE_NUMBER].title];
  cell22.innerHTML = ': ' + _phoneNumber;

  KASClient.UI.addElement(details, detailsDiv);

  // Location Summary
  var locationDiv = KASClient.UI.getElement('div', divAttributes);

  var locationHeader = KASClient.UI.getElement('div', {
    padding: '14px',
    'padding-bottom': '0pt',
  });
  locationHeader.className = 'comment-header';
  locationHeader.innerText = _strings[_form.questions[LOCATION].title];
  KASClient.UI.addElement(locationHeader, locationDiv);

  var location = KASClient.UI.getElement('div', {
    'padding-bottom': '14px',
    'padding-top': '14px',
  });

  if (
    _currentLocation.hasOwnProperty('lt') == true &&
    _currentLocation.hasOwnProperty('lg') == true
  ) {
    var locationMap = KASClient.UI.getElement('img', {
      width: '100%',
      height: 'auto',
      'max-height': '200pt',
      'padding-bottom': '10pt',
    });
    locationMap.src =
      'https://maps.googleapis.com/maps/api/staticmap?zoom=18&size=360x170&maptype=roadmap&markers=color:blue%7C%7C' +
      _currentLocation['lt'] +
      ',' +
      _currentLocation['lg'];
    locationMap.onerror = function (e) {
      KASClient.UI.removeElement(locationMap, location);
    };
    KASClient.UI.addElement(locationMap, location);
  }

  var locationName;
  if (_currentLocation['n'] != '') {
    locationName = KASClient.UI.getElement('div', {
      padding: '14px',
      'padding-top': '0pt',
      'padding-bottom': '0pt',
      color: '#32485f',
      'font-size': '12pt',
    });

    locationName.innerHTML = _currentLocation['n'];
  } else {
    locationName = KASClient.UI.getElement('div', {
      padding: '14px',
      'padding-top': '0pt',
      'padding-bottom': '0pt',
      color: '#6f7e8f',
      'font-size': '9pt',
    });

    locationName.innerHTML = _strings['strNoLocationLabel'];
  }
  KASClient.UI.addElement(locationName, location);

  KASClient.UI.addElement(location, locationDiv);

  KASClient.UI.addElement(textQuestionDetailsDiv, summaryView);
  KASClient.UI.addElement(startingTripDiv, summaryView);
  KASClient.UI.addElement(dateDiv, summaryView);
  KASClient.UI.addElement(startTimeDiv, summaryView);
  KASClient.UI.addElement(clutchDiv, summaryView);
  KASClient.UI.addElement(fanBeltDiv, summaryView);
  KASClient.UI.addElement(exhaustPipeDiv, summaryView);
  KASClient.UI.addElement(fuelTankDiv, summaryView);
  KASClient.UI.addElement(headLightsDiv, summaryView);
  KASClient.UI.addElement(sidelightsDiv, summaryView);
  KASClient.UI.addElement(indicatorLightsDiv, summaryView);
  KASClient.UI.addElement(plateLightsDiv, summaryView);
  KASClient.UI.addElement(windScreenDiv, summaryView);
  KASClient.UI.addElement(sideMorrorsDiv, summaryView);
  KASClient.UI.addElement(rearViewDiv, summaryView);
  KASClient.UI.addElement(pressureDiv, summaryView);
  KASClient.UI.addElement(treadDiv, summaryView);
  KASClient.UI.addElement(spareWheelDiv, summaryView);
  KASClient.UI.addElement(jackSpannerDiv, summaryView);
  KASClient.UI.addElement(firstAidDiv, summaryView);
  KASClient.UI.addElement(trianglesDiv, summaryView);
  KASClient.UI.addElement(ExtinguisherDiv, summaryView);
  KASClient.UI.addElement(radioDiv, summaryView);

  KASClient.UI.addElement(detailsDiv, summaryView);
  KASClient.UI.addElement(locationDiv, summaryView);
}

// Fetching address from location
function fetchAndPopulateAddress() {
  if (
    _currentLocation.hasOwnProperty('lt') == true &&
    _currentLocation.hasOwnProperty('lg') == true
  ) {
    var xhr = new XMLHttpRequest();
    var url =
      'https://maps.googleapis.com/maps/api/geocode/json?latlng=' +
      _currentLocation['lt'] +
      ',' +
      _currentLocation['lg'];
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.timeout = LOCATION_TIMEOUT;
    xhr.onload = function () {
      var status = this.status;
      var response;
      if (status == 200) {
        try {
          response = JSON.parse(this.response);
        } catch (e) {
          response = this.response;
        }
        populateAddress(response['results'][0]);
      }
      _isLocationRefreshing = false;
      inflateLocationView();
    };
    xhr.onerror = function () {
      _isLocationRefreshing = false;
      inflateLocationView();
    };
    xhr.send();
  } else {
    _isLocationRefreshing = false;
    inflateLocationView();
  }
}

function populateAddress(address) {
  _longAddress = address['formatted_address'];

  var state = '';
  _district = '';
  _postalCode = '';
  var address_components = address['address_components'];
  for (var component in address_components) {
    var types = address_components[component]['types'];
    for (var type in types) {
      if (types[type] == 'administrative_area_level_2') {
        _district = address_components[component]['long_name'];
      } else if (types[type] == 'administrative_area_level_1') {
        state = address_components[component]['long_name'];
      } else if (types[type] == 'postal_code') {
        _postalCode = address_components[component]['long_name'];
      }
    }
  }

  _shortAddress = '';
  if (_postalCode != '') {
    _shortAddress += _postalCode + ', ';
  }
  if (_district != '') {
    _shortAddress += _district + ', ';
  }
  if (state != '') {
    _shortAddress += state;
  }
}

function showError(errorMsg) {
  KASClient.App.showNativeErrorMessage(errorMsg);
}

// For debug
function dismissCurrentScreen() {
  KASClient.App.dismissCurrentScreen();
}
