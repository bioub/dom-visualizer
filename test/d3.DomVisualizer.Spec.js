describe("d3.domVisualizer", function() {

    var container = document.createElement("div");
    document.body.appendChild(container);

    describe("Function constructor instanciation", function() {

        it("should have correct default values", function() {
            var domVisualizer = new d3.domVisualizer(container);
            expect(domVisualizer.d3TreeRoot).toBe(false);
            expect(domVisualizer.duration).toBe(500);
            expect(domVisualizer.nodeSize[0]).toBe(50);
            expect(domVisualizer.nodeSize[1]).toBe(80);
            expect(domVisualizer.autoIncrement).toBe(0);
            expect(domVisualizer.fitToContainer).toBe(true);
            expect(domVisualizer.displayTextNodes).toBe(true);
            expect(domVisualizer.displayTextIndentNodes).toBe(false);
            expect(domVisualizer.displayCommentNodes).toBe(false);
        });

    });

    describe("parseHTML method", function() {

        it("should work for complete html", function() {
            var domVisualizer = new d3.domVisualizer(container);
            domVisualizer.parseHTML("<!doctype html><html><head></head><body></body></html>");
            expect(domVisualizer.autoIncrement).toBe(3);
            expect(domVisualizer.d3TreeRoot.value).toBe("html");
        });

        it("should work for document root body", function() {
            var domVisualizer = new d3.domVisualizer(container);
            domVisualizer.parseHTML("<body></body>");
            expect(domVisualizer.autoIncrement).toBe(1);
            expect(domVisualizer.d3TreeRoot.value).toBe("body");
        });

        it("should work for any document root", function() {
            var domVisualizer = new d3.domVisualizer(container);
            domVisualizer.parseHTML("<div></div>");
            expect(domVisualizer.autoIncrement).toBe(1);
            expect(domVisualizer.d3TreeRoot.value).toBe("div");
        });

    });
});