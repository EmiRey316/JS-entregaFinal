/**************************************************************
*                          CLASES
**************************************************************/

//Creo la clase global Loan, que contiene los parámetros y métodos generales de todos los tipos de préstamos.
class lending {
    constructor (id, productType, amount, term) {
        this.id = id;
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
            
            //Actualizo el saldo.
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
*                    CONSTANTES Y VARIABLES
**************************************************************/

const anualRateSimple = 40;
const anualRateAmerican = 50;



/**************************************************************
*                          FUNCIONES
**************************************************************/

//Función de Bootstrap para activar los tooltips.
$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip();   
});


//Función para transformar un valor númerico en formato de moneda.
const valueToCurrency = (value) => {
    return new Intl.NumberFormat('es-UY', {style: 'currency',currency: 'UYU', minimumFractionDigits: 2}).format(value);
}


//Función para cargar y guardar en storage los datos de un préstamo.
const saveLoan = (e) => {
    //Variable para guardar el último ID creado y cargado en el storage.
    let lastID = 0;

    //Creo la variable que será utilizada para crear el objeto préstamo según el tipo y el array que los contendrá.
    let loan;
    let loanCollection = [];

    //Si ya existe un historial de préstamos en el storage, traigo el ID del último elemento y el array. Con esto me aseguro de no repetir ID.
    if ((JSON.parse(localStorage.getItem("loans")) == null) || (JSON.parse(localStorage.getItem("loans")).length == 0)) {
        lastID = 0;
    } else {
        loanCollection = JSON.parse(localStorage.getItem("loans"));
        lastID = loanCollection[loanCollection.length - 1].id;
    }

    let amount = Number($("#amountSlider").val());
    let term = Number($("#termSlider").val());
    
    //Primero creo el objeto con la clase correspondiente al tipo de producto, usando roro.
    switch ($(`#productType`).val()) {
        case "simple":
            loan = new simpleLending(lastID + 1, "Simple", amount, term);
            break;
    
        default:
            loan = new americanLending(lastID + 1, "Americano", amount, term);
    }

    //Genero las cuotas y el pago total del préstamo.
    loan.loadFees();

    //Guardo el nuevo préstamo en el storage.
    loanCollection.push(loan);
    localStorage.setItem("loans", JSON.stringify(loanCollection));

    //Ejecuto la función para mostrar los resultados al salvar.
    showResults(loan);
}


//Muestro el resultado de la solicitud de préstamo, con JQuery.
const showResults = (loan) => {
    $("#showAmount").text(valueToCurrency(loan.amount));
    $("#showTerm").text(`${loan.term} cuotas`);
    $("#showFee").text(valueToCurrency(loan.quotas[0]));
    $("#showTotalPayment").text(valueToCurrency(loan.totalPayment));

    //Datos mostrados según tipo de préstamo.
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
        
            default:
                loansToPrint = loanCollection.filter(e => e.status == "deleted");
                break;
        }
    }

    //Primero elimino los datos que pudiesen existir previamente.
    $("#loansTableBody").text("");

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
                            <button data-bs-toggle="modal" data-bs-target="#amortizationModal" onclick="viewLoan(${e.id})" data-toggle="tooltip" data-placement="top" title="Ver cuotas" data-animation="true">
                                <img src="multimedia/view.png" alt="View button">
                            </button>
                            <button class="deleteBtn" onclick="deleteLoan(${e.id})" data-toggle="tooltip" data-placement="top" title="Eliminar" data-animation="true">
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
    //Primero borro la información que pudiese haber quedado.
    $("#amortizationTableBody").text("");

    let amortizationFees = loanToview.quotas;

    //Creo la tabla que mostrará las cuotas del préstamo.
    amortizationFees.forEach(e => {
        $("#amortizationTableBody").append(`
            <tr>
                <th scope="row">${amortizationFees.indexOf(e) + 1}</th>
                <td>${valueToCurrency(e)}</td>
            </tr>
        `);
    })
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
const applicantsTableCreate = (applicant, applicantId) => {
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
    
    //Función interna para calcular la edad actual a través de año de nacimiento que trae la API. Desconocida para los que no tienen.
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
                    <button>
                        <img src="multimedia/view.png" alt="View button">
                    </button>
                </div>
            </td>
        </tr>
    `);
}


//Función para posicionar el Tooltip sobre un slider.
const rangePosition = (selector) => {
    let range = selector.attr("max") - selector.attr("min");
    return (selector.val() - selector.attr("min")) * selector.width() / range;
}



/**************************************************************
*                          EJECUCIÓN
**************************************************************/
//Valor inicial y evento para mostrar el valor del slider del monto a medida que cambia.
$(`#amountTooltipTitle`).text($(`#amountSlider`).attr("min"));
$(`#amountSlider`).on(`input`, () => {
    $("#amountTooltip").css({left: rangePosition($("#amountSlider"))});
    $(`#amountTooltipTitle`).text($(`#amountSlider`).val());
    $('#amountTooltip').tooltip('show');
})

//Evento que oculta el Tooltip  al apartar el mouse.
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
loansTableCreate("active");

//Evento al presionar el botón para ver los préstamos activos.
$("#printActiveBtn").on("click", () => {
    //Primero compruebo que el botón no esté activo ya, para no volver a crear la tabla.
    if (!($("#printActiveBtn").hasClass("active"))) {
        loansTableCreate("active");
        //Se hacen los cambios de clases correspondientes.
        $("#printActiveBtn").addClass("active");
        $("#printDeletedBtn").removeClass("active");
    }
});

//Evento al presionar el botón para ver los préstamos eliminados.
$("#printDeletedBtn").on("click", () => {
    //Primero compruebo que el botón no esté activo ya, para no volver a crear la tabla.
    if (!($("#printDeletedBtn").hasClass("active"))) {
        loansTableCreate("deleted");
        $("#printDeletedBtn").addClass("active");
        $("#printActiveBtn").removeClass("active");
    }
});


//Evento que trae la info de la API y guarda los datos en la tabla cuando la página.
$(document).ready(function () {
    //Compruebo que exista #mainApplicants para hacer la consulta solo en la página correspondiente y no consumir más recursos.
    if ( $("#mainApplicants").length > 0 ) {
        $.ajax({
            method: "GET",
            url: "applicants.json",
            success: function(applicants) {
                //Borro el caption que indica la carga.
                $("#applicantsTableBodyCaption").text("");
                for (const applicant of applicants) {
                    applicantsTableCreate(applicant);
                }
            }
        });
    }
});