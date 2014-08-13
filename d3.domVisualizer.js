d3.domVisualizer = function(containerSelector, options, undefined) {
    options || (options = {});
    this.d3TreeRoot = {},
        this.duration = options.duration || 500;
    this.autoIncrement = 0;
    this.displayTextNodes = options.displayTextNodes || true;
    this.displayTextIndentNodes = options.displayTextIndentNodes || false;
    this.displayCommentNodes = options.displayCommentNodes || false;

    var container = document.querySelector(containerSelector);
    var w = container.clientWidth;
    var h = container.clientHeight;


    this.tree = d3.layout.tree().size([w, h - 65]); // margin bottom


    this.diagonal = d3.svg.diagonal()
        .projection(function (d) {
            return [d.x, d.y];
        });

    this.vis = d3.select(containerSelector).append("svg:svg")
        .attr("width", w)
        .attr("height", h)
        .append("svg:g")
        .attr("transform", "translate(0,40)"); // margin top
}

d3.domVisualizer.prototype.update = function() {

    var nodes = this.tree.nodes(this.d3TreeRoot);

    // Select all nodes and syncs with d3TreeRoot
    var node = this.vis.selectAll("g.node")
        .data(nodes, function (d) {
            return d.id;
        });

    // Move existing nodes to their new position
    node.transition()
        .duration(this.duration)
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
        .style("opacity", 1);

    // Add new nodes
    var nodeEnter = node.enter().append("svg:g")
        .attr("class", function (d) {
            return "node " + d.type;
        })
        .style("opacity", 0.5)
        .attr("transform", function (d) {
            var x = (d.parent && d.parent.x0) ? d.parent.x0 : this.d3TreeRoot.x;
            var y = (d.parent && d.parent.y0) ? d.parent.y0 : this.d3TreeRoot.y;
            return "translate(" + x + "," + y + ")";
        }.bind(this));

    // Add circle in nodes, radius 10px
    nodeEnter.append("svg:circle")
        .attr("r", 10)

    // Add node name 5px above
    nodeEnter.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", -15)
        .text(function (d) {
            return d.name;
        });

    // Move new nodes to their position
    nodeEnter.transition()
        .duration(this.duration)
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
        .style("opacity", 1);

    // Remove old nodes
    node.exit().remove();

    // Select all links
    var link = this.vis.selectAll("path.link")
        .data(this.tree.links(nodes), function (d) {
            return d.target.id;
        });

    // Insert new links at the parent previous position
    link.enter().insert("svg:path", "g")
        .attr("class", "link")
        .attr("d", function (d) {
            var x = (d.source && d.source.x0) ? d.source.x0 : this.d3TreeRoot.x;
            var y = (d.source && d.source.y0) ? d.source.y0 : this.d3TreeRoot.y;
            var o = {x: x, y: y};
            return this.diagonal({source: o, target: o});
        }.bind(this))
        .style("opacity", 0);

    // Transition links to their new position.
    link.transition()
        .duration(this.duration)
        .attr("d", this.diagonal)
        .style("opacity", 1)

    // Remove old links
    link.exit().remove();

    // Remember current position for future transitions
    nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });

}

d3.domVisualizer.prototype.getRealNodeName = function (domNode) {
    var realNodeName = domNode.tagName.toLowerCase();

    if (domNode.hasAttribute("id")) {
        realNodeName += "#" + domNode.getAttribute("id");
    }
    else if (domNode.hasAttribute("class")) {
        [].forEach.call(domNode.className.split(" "), function (className) {
            realNodeName += "." + className;
        });
    }

    return realNodeName;
}

d3.domVisualizer.prototype.buildTree = function (domNode, d3Node) {
    d3Node.id = ++this.autoIncrement;

    switch (domNode.nodeType) {
        case Node.ELEMENT_NODE:
            d3Node.name = this.getRealNodeName(domNode);
            d3Node.type = "element";

            if (domNode.childNodes.length) {
                d3Node.children = [];
                d3Node._children = [];
                [].forEach.call(domNode.childNodes, function (domChildNode) {
                    var d3ChildNode = {};
                    d3Node._children.push(d3ChildNode);
                    this.buildTree(domChildNode, d3ChildNode);
                }.bind(this));
            }

            break;
        case Node.TEXT_NODE:
            d3Node.name = "#text";
            d3Node.type = domNode.nodeValue.match(/^\s+$/) ? "text indent" : "text";

            break;
        case Node.COMMENT_NODE:
            d3Node.name = "#comment";
            d3Node.type = "comment";

            break;
    }
}

d3.domVisualizer.prototype.parseHTML = function(htmlStr) {
    var doc = document.implementation.createHTMLDocument("");

    var domRoot;
    if (htmlStr.indexOf("<html") !== -1) {
        doc.documentElement.innerHTML = htmlStr;
        domRoot = doc.documentElement;
    }
    else if (htmlStr.indexOf("<body") !== -1) {
        doc.documentElement.innerHTML = htmlStr;
        domRoot = doc.body;
    }
    else {
        doc.body.innerHTML = htmlStr;
        domRoot = doc.body.firstElementChild;
    }

    this.buildTree(domRoot, this.d3TreeRoot);
    this.addNodesByType("element");
    this.addNodesByType("text");
    this.addNodesByType("comment");
}

d3.domVisualizer.prototype.addNodesByType = function (type, node) {
    node = node || this.d3TreeRoot;

    if(typeof node._children !== "undefined") {
        node.children = node.children || [];

        var newNodes = node._children.filter(function (elt) {
            return elt.type === type;
        });

        var bisect = d3.bisector(function (a, b) {
            return a.id - b.id;
        }).right;

        newNodes.forEach(function (elt) {
            var pos = bisect(node.children, elt);
            node.children.splice(pos, 0, elt);
        });

        node.children.forEach(function (childNode) {
            this.addNodesByType(type, childNode);
        }.bind(this));
    }
};

d3.domVisualizer.prototype.removeNodesByType = function (type, node) {
    node = node || this.d3TreeRoot;

    if (typeof node._children !== "undefined") {

        for (var pos = 0; pos < node.children.length; pos++) {
            if (node.children[pos].type.indexOf(type) !== -1) {
                node.children.splice(pos--, 1);
            }
            else {
                this.removeNodesByType(type, node.children[pos]);
            }
        }
    }
};