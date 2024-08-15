var deviceId = null;
$(document).ready(function () {
    var selectedProducts = [];
   
    

    connection.on("ReceiveProductList", function (products) {
        var productTable = $("#productTable");
        productTable.empty();

        for (var i = 0; i < products.length; i++) {
            var product = products[i];
            var row = "<tr>" +
                "<td><input type='checkbox' class='productCheckbox' data-product-id='" + product.id + "'></td>" +
                "<td>" + product.id + "</td>" +
                "<td>" + product.barcode + "</td>" +
                "<td>" + product.name + "</td>" +
                "<td><img src='" + product.image + "' alt='Product Image' width='50'></td>" +
                "<td>" + product.unitSale + "</td>" +
                "<td><input type='number' class='quantityInput' data-product-id='" + product.id + "'></td>" +
                "<td><span class='totalSale'></span></td>" +
                "<td><span class='total'></span></td>" +
                "<td><span class='vat'></span></td>" +
                "</tr>";

            productTable.append(row);
        }

        $(".productCheckbox").change(function () {
            var productId = $(this).data("product-id");

            if (this.checked) {
                var product = products.find(p => p.id === productId);
                selectedProducts.push(product);
            } else {
                var index = selectedProducts.findIndex(p => p.id === productId);
                selectedProducts.splice(index, 1);
            }

            updateTotals();
        });

        $(".quantityInput").on("input", function () {
            var productId = $(this).data("product-id");
            var quantity = parseInt($(this).val());

            var product = products.find(p => p.id === productId);
            product.quantity = quantity;

            updateTotals();
        });
    });

    connection.on("ReceiveInvoice", function (invoice) {
        $("#invoiceNumber").text(invoice.invoiceNumber);
        $("#paymentDate").text(invoice.paymentDate);
        $("#paymentTypeText").text(invoice.paymentTypeText);

        var invoiceItems = $("#invoiceItems");
        invoiceItems.empty();

        for (var i = 0; i < invoice.items.length; i++) {
            var item = invoice.items[i];
            var row = "<tr>" +
                "<td>" + item.productName + "</td>" +
                "<td>" + item.sale + "</td>" +
                "<td>" + item.quantity + "</td>" +
                "</tr>";

            invoiceItems.append(row);
        }

        $("#invoiceTotal").text(invoice.total);
        $("#grandTotal").text(invoice.grandTotal);

        $("#invoiceBox").show();
    });

    function updateTotals() {
        var subTotal = 0;

        for (var i = 0; i < selectedProducts.length; i++) {
            var product = selectedProducts[i];

            var quantityInput = $(".quantityInput[data-product-id='" + product.id + "']");
            var quantity = parseInt(quantityInput.val());

            var totalSale = quantity * product.unitSale;
            var total = totalSale;
            var vat = total * 0.05;

            var totalSaleElement = quantityInput.closest("tr").find(".totalSale");
            var totalElement = quantityInput.closest("tr").find(".total");
            var vatElement = quantityInput.closest("tr").find(".vat");

            totalSaleElement.text(totalSale.toFixed(2));
            totalElement.text(total.toFixed(2));
            vatElement.text(vat.toFixed(2));

            subTotal += total;
        }

        $("#subTotal").text("Subtotal: " + subTotal.toFixed(2));

        var vat = subTotal * 0.05;
        $("#vat").text("VAT (5%): " + vat.toFixed(2));

        var total = subTotal + vat;
        $("#total").text("Total: " + total.toFixed(2));
    }

    $("#checkoutButton").click(function () {
        if (selectedProducts.length === 0) {
            alert("No products selected!");
            return;
        }

        var paymentType = $("#paymentType").val();

        var invoice = {
            deviceId: deviceId,
            paymentType: paymentType,
            items: selectedProducts.map(p => ({
                productId: p.id,
                quantity: p.quantity
            }))
        };

        connection.invoke("Checkout", invoice).catch(function (error) {
            console.error(error);
        });
    });

    connection.start().then(function () {
        console.log("SignalR connected.");

        connection.invoke("GetProductList").catch(function (error) {
            console.error(error);
        });

        connection.invoke("GetDeviceId").then(function (id) {
            deviceId = id;
        }).catch(function (error) {
            console.error(error);
        });
    }).catch(function (error) {
        console.error(error);
    });
});
