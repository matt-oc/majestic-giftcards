window.$ = window.jQuery = require('jquery');
const {
  ipcRenderer
} = require('electron');

const password = document.getElementById("pin-input");
const cardInput = document.getElementById("card-input");
const lockBtn = document.getElementById("lock-btn");
const allCardsTable = document.getElementById("all-cards-table");
const backBtn = document.getElementById("back-btn");
const listCardBtn = document.getElementById("list-card-btn");
const balanceForm = document.getElementById("balance-form");
const cardOwner = document.getElementById("card-owner");
const balanceEdit = document.getElementById("balance-amount");
const addRadio = document.getElementById("add-radio");
const minusRadio= document.getElementById("minus-radio");
const pin = 5145;

let cardNumber = 0;
let elements = "";
let balance = 0;

password.addEventListener("input", checkValue);
cardInput.addEventListener("input", checkInput);
lockBtn.addEventListener("click", lockApplication);
backBtn.addEventListener("click", showCardInput);
listCardBtn.addEventListener("click", resetForm);
cardInput.addEventListener("blur", focusInput);
balanceForm.addEventListener("submit", (e) => {
  e.preventDefault();
  console.log(balanceEdit);
  if (minusRadio.checked && balanceEdit.value > balance) {
    alert("Balance insufficient for this transaction")
  }

  console.log(e);
});

function checkValue(e) {
  if (e.target.value == pin) {
    $("#login-container").hide();
    $("#card-input").focus();
    e.target.value = "";
  } else if (e.target.value.length == 4) {
    $("#password-error").css('visibility', 'visible');
    e.target.value = "";
    setTimeout(() => {
      $("#password-error").css('visibility', 'hidden');
    }, 5000);
  }
}

function checkInput(e) {
  if (e.target.value.startsWith("%")) {
    if (e.target.value.length == 9) {
      cardInput.removeEventListener("input", checkInput);
      cardNumber = e.target.value.substring(1, 9);
      ipcRenderer.send('card-input', cardNumber);
      $("#card-num-loader").css('visibility', 'visible');
      e.target.value = "";
      $("#card-input").prop('disabled', true);
    }
  } else if (e.target.value.length == 8 && /^\d+$/.test(e.target.value)) {
    ipcRenderer.send('card-input', e.target.value);
    $("#card-num-loader").css('visibility', 'visible');
    cardNumber = e.target.value;
    e.target.value = "";
  } else if (e.target.value.length == 8 && !/^\d+$/.test(e.target.value)) {
    $("#card-error").css('visibility', 'visible');
    e.target.value = "";
    setTimeout(() => {
      $("#card-error").css('visibility', 'hidden');
    }, 5000);
  }
}

function focusInput() {
  if ($("#login-container").is(':hidden') && $("#card-swipe-container").is(':visible')) {
    $("#card-input").focus();
  } else {
    $("#card-input").blur();
  }
}

function resetForm() {
  balanceForm.reset();
}

function lockApplication() {
  $("#password-error").css('visibility', 'hidden');
  $("#login-container").show();
  $("#card-input").blur();
}

function showCardInput() {
  $("#card-input").prop('disabled', false);
  $("#card-swipe-container").show();
  $("#card-input").focus();
  cardInput.addEventListener("input", checkInput);
  $("#card-no").text("Card No: ");
  $("#date-issued").text("Date Issued: ");
  $("#owner").text("Owner: ");
  $("#balance").text("€ 0");
}

function editCard() {
  let card = this.getAttribute("data-card");
  ipcRenderer.send('card-input', card);
  $("#card-num-loader").css('visibility', 'visible');
  cardNumber = card;
  $("#cards-modal-close").click();
}

ipcRenderer.on('appVersion', (event, messages) => {
  $("#version").html("Version: " + messages);
})

ipcRenderer.on('failure', (event, messages) => {
  $("#failure").show();
  setTimeout(() => {
    $("#failure").hide();
  }, "6000")
})

ipcRenderer.on('success', (event, messages) => {
  $("#success").show();
  setTimeout(() => {
    $("#success").hide();
  }, "6000")
})

ipcRenderer.on('allCards', (event, messages) => {
  for (let i = 0; i < messages.length; i++) {
    $("#all-cards-table").append('<tr><td>' + messages[i].CARDNUM + '</td><td>€ ' + Math.abs(messages[i].AMOUNTDUE) + '</td><td>' + ((messages[i].COMPANYNAME != null && messages[i].COMPANYNAME.length > 0) ? messages[i].COMPANYNAME : 'Null') + '</td><td>' + ((messages[i].STARTDATE != null && messages[i].STARTDATE.length > 9) ? messages[i].STARTDATE.substring(0, 10) : 'Null') + '</td><td>' + ((messages[i].LASTVISIT != null && messages[i].LASTVISIT.length > 9) ? messages[i].LASTVISIT.substring(0, 10) : 'Null') + '</td><td><button type="button" class="btn btn-info edit" data-card=' + messages[i].CARDNUM + '><i class="fa fa-pencil mr-2" aria-hidden="true"></i>Edit</button></td></tr>');
  }
  elements = $(".edit");
  for (let el of elements) {
    el.addEventListener("click", editCard);
  }
})

ipcRenderer.on('card', (event, messages) => {
  $("#card-num-loader").css('visibility', 'hidden');
    $("#card-modal-label").html("Card Number: <span class='bold'>" + cardNumber + "</span>");

  if (messages.length == 0) {
      $("#modal-balance").append(0);
    $("#card-no").append(cardNumber);
    $("#date-issued").append("Blank Card");
    $("#owner").append("Blank Card");
  } else {
    balance = Math.abs(messages[0].AMOUNTDUE);
      $("#modal-balance").append(Math.abs(messages[0].AMOUNTDUE));
    $("#card-no").append(messages[0].CARDNUM);
    $("#date-issued").append(((messages[0].STARTDATE != null && messages[0].STARTDATE.length > 9) ? messages[0].STARTDATE.substring(0, 10) : 'Blank'));
    $("#owner").append(((messages[0].COMPANYNAME != null && messages[0].COMPANYNAME.length > 0) ? messages[0].COMPANYNAME : 'Blank'));
    if (messages[0].AMOUNTDUE != 0) {
      $("#balance").text("€ " + Math.abs(messages[0].AMOUNTDUE));
    }
  }
  $("#card-swipe-container").hide();
  $("#card-input").blur();
})
