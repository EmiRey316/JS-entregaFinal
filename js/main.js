/**************************************************************
*                          CLASES
**************************************************************/

//Creo la clase global Loan, que contiene los parámetros y métodos generales de todos los tipos de préstamos.
class lending {
    constructor (id, applicantId, applicant, productType, amount, term) {
        this.id = id;
        this.applicantId = applicantId;
        this.applicant = applicant;
        this.productType = productType;
        this.amount = amount;
        this.term = term;
        this.status = "active";
        this.quotas = [];
        this.totalPayment = 0;
    }

    interest(capital, anualRate) {
        return (capital * (anualRate / 12)) / 100;
    }

    //Método para guardar las cuotas en el array de colección.
    saveFee(feeValue) {
        this.quotas.push(feeValue);
    }
}


//Creo la clase simpleLending como subclase de Loan.
class simpleLending extends lending {
    loadFees() {
        //Defino la variable balance, como el saldo de capital que falta pagar.
        let balance = this.amount;
        let monthlyPayment = this.amount / this.term;

        //Ciclo que calcula y carga en la colección el valor de cada cuota. Además va sumando el totalPayment.
        for (let i = 1; i <= this.term; i++) {
            let feeInterest = this.interest(balance, anualRateSimple);
            let feeValue = monthlyPayment + feeInterest;
            this.totalPayment = this.totalPayment + feeValue;
            this.saveFee(feeValue);

            //Por último actualizo el saldo.
            balance = balance - monthlyPayment;
        }
    }
}


//Creo la clase LoanAmericano como subclase de Loan.
class americanLending extends lending {
    loadFees() {
        let monthlyInterest = this.interest(this.amount, anualRateAmerican);

        //Las primeras cuotas únicamente tienen interés, las cargo con este ciclo.
        for (let i = 1; i < this.term; i++) {
            this.saveFee(monthlyInterest);
        }

        //Calculo la cuota final y la guardo.
        let finalFee = monthlyInterest + this.amount;
        this.saveFee(finalFee);

        //En este caso, el pago total es el monto solicitado sumado al interes pagado en todas las cuotas. Lo cálculo y transformo.
        this.totalPayment = this.amount + (monthlyInterest * this.term);
    }
}



/**************************************************************
*               CONSTANTES Y VARIABLES GLOBALES
**************************************************************/

const anualRateSimple = 40;
const anualRateAmerican = 50;



/**************************************************************
*                          FUNCIONES
**************************************************************/

//Función para transformar un valor númerico en formato de moneda.
const valueToCurrency = (value) => {
    return new Intl.NumberFormat('es-UY', {style: 'currency',currency: 'UYU', minimumFractionDigits: 2}).format(value);
}


//Función para posicionar el Tooltip sobre un slider.
const rangePosition = (selector) => {
    let range = selector.attr("max") - selector.attr("min");
    return (selector.val() - selector.attr("min")) * selector.width() / range;
}


//Función para cargar y guardar en storage los datos de un préstamo.
const saveLoan = () => {
    let loan;
    let loanCollection = [];

    //Inicializo la variable para guardar el último ID creado y cargado en el storage.
    let lastID = 0;

    //Si ya existe un historial de préstamos en el storage, traigo el ID del último elemento y el array. Con esto me aseguro de no repetir ID.
    if ((JSON.parse(localStorage.getItem("loans")) == null) || (JSON.parse(localStorage.getItem("loans")).length == 0)) {
        lastID = 0;
    } else {
        loanCollection = JSON.parse(localStorage.getItem("loans"));
        lastID = loanCollection[loanCollection.length - 1].id;
    }

    let amount = Number($("#amountSlider").val());
    let term = Number($("#termSlider").val());
    let applicantId = $("#applicantsList").val();
    
    //Primero creo el objeto con la clase correspondiente al tipo de producto, usando roro.
    switch ($(`#productType`).val()) {
        case "simple":
            loan = new simpleLending(lastID + 1, applicantId, $(`#${applicantId}`).text(), "Simple", amount, term);
            break;

        default:
            loan = new americanLending(lastID + 1, applicantId, $(`#${applicantId}`).text(), "Americano", amount, term);
    }

    //Genero las cuotas y el pago total del préstamo.
    loan.loadFees();

    //Guardo el nuevo préstamo en el storage.
    loanCollection.push(loan);
    localStorage.setItem("loans", JSON.stringify(loanCollection));

    //Ejecuto la función para mostrar los resultados al salvar.
    showResults(loan);
}


//Muestro el resultado de la solicitud de préstamo, con los detalles de los cálculos.
const showResults = (loan) => {
    $("#showAmount").text(valueToCurrency(loan.amount));
    $("#showTerm").text(`${loan.term} cuotas`);
    $("#showFee").text(valueToCurrency(loan.quotas[0]));
    $("#showTotalPayment").text(valueToCurrency(loan.totalPayment));

    //Datos que se muestran según el tipo de préstamo.
    switch (loan.productType) {
        case "Simple":
            $("#showProductType").text("Simple");
            $("#showTEA").text(`${anualRateSimple} %`);
            break;
    
        default:
            $("#showProductType").text("Americano");
            $("#showTEA").text(`${anualRateAmerican} %`);
    }
}


//Creación de tabla con el historial de préstamos guardados en storage.
const loansTableCreate = (type) => {
    let loanCollection = JSON.parse(localStorage.getItem("loans"));
    let loansToPrint = [];
    
    //Switch que se ejecuta solo si hay préstamos cargados en el storage, para evitar errores.
    if (!(loanCollection == null)) {
        switch (type) {
            case "active":
                loansToPrint = loanCollection.filter(e => e.status == "active");
                break;
        
            case "deleted":
                loansToPrint = loanCollection.filter(e => e.status == "deleted");
                break;
        }
    }

    //Primero elimino los datos que pudiesen existir previamente, al cambiar entre Activos y Eliminados.
    $("#loansTableBody").empty();

    //Creando cada fila de la tabla por cada loan del historial.
    if (loansToPrint == null || loansToPrint.length == 0) {
        $("#loansTableBody").append(`
            <caption>Vacío</caption>
        `);
    } else {
        loansToPrint.forEach(e => {
            $("#loansTableBody").prepend(`
                <tr id="row${e.id}">
                    <th scope="row">
                        <div>${e.id}</div>
                    </th>
                    <td>
                        <div>${e.applicant}</div>
                    </td>
                    <td>
                        <div>${e.productType}</div>
                    </td>
                    <td>
                        <div>${valueToCurrency(e.amount)}</div>
                    </td>
                    <td>
                        <div>${e.term}</div>
                    </td>
                    <td>
                        <div class="buttonsCell">
                            <button data-bs-toggle="modal" data-bs-target="#amortizationModal" onclick="viewLoan(${e.id})" title="Ver cuotas">
                                <img src="multimedia/view.png" alt="View button">
                            </button>
                            <button class="deleteBtn" onclick="deleteLoan(${e.id})" title="Eliminar">
                                <img src="multimedia/delete.png" alt="Delete button">
                            </button>
                        </div>
                    </td>
                </tr>
            `);
        })

        if (type == "deleted") {
            $(".deleteBtn").css("display", "none");
        }
    }
}


//Función para ver más detalles de un préstamo concreto, al presionar el botón "Ver". Se mostrará en un modal.
const viewLoan = (id) => {
    let loanCollection = JSON.parse(localStorage.getItem("loans"));
    let loanToview = loanCollection.find(e => e.id == id);
    //Primero borro la información que pudiese haber quedado de un préstamo anterior.
    $("#amortizationTableBody").empty();

    let amortizationFees = loanToview.quotas;
    
    //Creo la tabla que mostrará las cuotas del préstamo.
    for (let i = 0; i < amortizationFees.length; i++) {
        $("#amortizationTableBody").append(`
            <tr>
                <th scope="row">${i + 1}</th>
                <td>${valueToCurrency(amortizationFees[i])}</td>
            </tr>
        `);
    }
}


//Función para borrar del historial un préstamo concreto, al presionar el botón correspondiente.
const deleteLoan = (id) => {
    //Primero creo el modal de confirmación, modal de Bootstrap.
    $("body").append(`
        <div class="modal fade show" id="deleteModal" data-bs-backdrop="static" tabindex="-1" style="display: block;" aria-modal="true" role="dialog">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Atención</h3>
                    </div>
                    <div class="modal-body">
                        <p>Desea eliminar el préstamo <strong>${id}</strong>?</p>
                    </div>
                    <div class="modal-footer">
                        <button id="deleteCanceled" type="button" class="btn btn-secondary">Cancelar</button>
                        <button id="deleteConfirmed" type="button" class="btn btn-danger">Confirmar</button>
                    </div>
                </div>
            </div>
        </div>
    `);

    //Elimino el modal al presionar el botón Cancelar.
    $("#deleteCanceled").on("click", () => {
        $("#deleteModal").remove();
    });

    //Evento que se ejecuta al presionar el botón "Aceptar" del modal.
    $("#deleteConfirmed").on("click", () => {
        //Cambio el estado del préstamo en el storage.
        let loanCollection = JSON.parse(localStorage.getItem("loans"));
        loanCollection[id - 1].status = "deleted";
        localStorage.setItem("loans", JSON.stringify(loanCollection));
        
        //Animacion de eliminación de la línea de la tabla.
        $(`#row${id} div`).slideUp("slow",() => {
                                        $(`#row${id}`).remove();
                                    });
        
        //Elimino el modal al finalizar.
        $("#deleteModal").remove();
    });
}


//Creación de tabla con el solicitantes traidos de la API.
const applicantsTableCreate = (applicant) => {

    //Función interna para pasar a español el genero que viene de la API
    const genderToSpanish = (gender) => {
        let genderInSpanish;
        switch (gender) {
            case "female":
                genderInSpanish = "Femenino";
                break;

            default:
                genderInSpanish = "Masculino";
                break;
        }

        return genderInSpanish;
    }
    
    //Función interna para calcular la edad actual a través de año de nacimiento que trae la API.
    const age = (yearOfBirth) => {
        let actualDate = new Date();
        let actualYear = actualDate.getFullYear();
        
        return actualYear - yearOfBirth;
    }

    //Creación de la tabla.
    $("#applicantsTableBody").append(`
        <tr>
            <th scope="row">
                <div>${applicant.id}</div>
            </th>
            <td>
                <div>${applicant.name}</div>
            </td>
            <td>
                <div>${genderToSpanish(applicant.gender)}</div>
            </td>
            <td>
                <div>${age(applicant.yearOfBirth)}</div>
            </td>
            <td>
                <div class="buttonsCell">
                    <button data-bs-toggle="modal" data-bs-target="#loansModal" onclick="viewApplicantLoans(${applicant.id})" title="Ver préstamos">
                        <img src="multimedia/view.png" alt="View button">
                    </button>
                </div>
            </td>
        </tr>
    `);
}


//Función para ver los préstamos de un solicitante en concreto, al presionar el botón "Ver". Se mostrará en un modal.
const viewApplicantLoans = (applicantId) => {
    let loanCollection = JSON.parse(localStorage.getItem("loans"));
    let loansToview = loanCollection.filter(e => e.applicantId == applicantId);

    //Primero borro la información que pudiese haber quedado de otro solicitante.
    $("#applicantLoansTableBody").empty();

    //Creo la tabla que mostrará los préstamos del solicitante.
    loansToview.forEach(e => {
        $("#applicantLoansTableBody").append(`
            <tr>
                <th scope="row">${e.id}</th>
                <td>${e.productType}</td>
                <td>${e.amount}</td>
                <td>${e.term}</td>
            </tr>
        `);
    })
}



/**************************************************************
*                          EJECUCIÓN
**************************************************************/

//Evento con función de Bootstrap para activar los tooltips.
$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip();   
});


//Valor inicial y evento para mostrar el valor del slider del monto a medida que cambia.
$(`#amountTooltipTitle`).text($(`#amountSlider`).attr("min"));
$(`#amountSlider`).on(`input`, () => {
    $("#amountTooltip").css({left: rangePosition($("#amountSlider"))});
    $(`#amountTooltipTitle`).text($(`#amountSlider`).val());
    $('#amountTooltip').tooltip('show');
})

//Evento que oculta el Tooltip al apartar el mouse.
$("#amountSlider").on('mouseleave', () => {
    $('#amountTooltip').tooltip('hide');
})


//Valor inicial y evento para mostrar el valor del slider del plazo a medida que cambia.
$(`#termTooltipTitle`).text($(`#termSlider`).attr("min"));
$(`#termSlider`).on(`input`, () => {
    $("#termTooltip").css({left: rangePosition($("#termSlider"))});
    $(`#termTooltipTitle`).text($(`#termSlider`).val());
    $('#termTooltip').tooltip('show');
})

//Evento que oculta el Tooltip al apartar el mouse.
$("#termSlider").on('mouseleave', () => {
    $('#termTooltip').tooltip('hide');
})


//Al enviar el formulario se guarda el préstamo y se muestran los resultados.
$("#simulatorForm").on("submit", (e) => { 
    e.preventDefault();
    $("#sectionResults").slideUp("slow", () => {saveLoan()})
                        .slideDown("slow", () => {
                            let mainHeight = $("#mainSimulator").height();
                            $("#mainSimulator").css("min-height", mainHeight);
                        });
    //Con este último callback se "bloquea" la altura del elemento para que la pantalla no suba y baje junto con los slides.
});




//Creación de la tabla de la página "Préstamos" al abrir.
$(document).ready(function() {
    loansTableCreate("active");   
});


//Evento que se ejecuta al presionar el botón para ver los préstamos activos.
$("#printActiveBtn").on("click", () => {
    //Primero compruebo que el botón no esté activo ya, para no volver a crear la tabla.
    if (!($("#printActiveBtn").hasClass("active"))) {
        loansTableCreate("active");
        //Se hacen los cambios de clases correspondientes.
        $("#printActiveBtn").addClass("active");
        $("#printDeletedBtn").removeClass("active");
    }
});

//Evento que se ejecuta al presionar el botón para ver los préstamos eliminados.
$("#printDeletedBtn").on("click", () => {
    //Primero compruebo que el botón no esté activo ya, para no volver a crear la tabla.
    if (!($("#printDeletedBtn").hasClass("active"))) {
        loansTableCreate("deleted");
        $("#printDeletedBtn").addClass("active");
        $("#printActiveBtn").removeClass("active");
    }
});




//Evento que trae la info de la API, que se ejecuta tanto en la página "Solicitantes" como "Simulador".
$(document).ready(function () {
    //Compruebo en que página me encuentro para no consumir recursos en el resto, me parece que así es la forma que funcionaría mejor.
    if (($("#applicantsPage").length > 0) || ($("#simulatorPage").length > 0)) {
        $.ajax({
            method: "GET",
            url: "applicants.json",
            success: function(applicants) {
                    if ($("#applicantsPage").length > 0) {
                        //Ejecución para la página "Solicitante", comienzo borrando el caption que indica la carga.
                        $("#applicantsTableBodyCaption").empty();
                        for (const applicant of applicants) {
                            applicantsTableCreate(applicant);
                        }
                    } else {
                        //Ejecución de la página "Simulador"
                        for (const applicant of applicants) {
                            $("#applicantsList").append(`
                                <option id=${applicant.id} value=${applicant.id}>${applicant.name}</option>
                            `)
                        }
                    }
            }
        });
    }
});