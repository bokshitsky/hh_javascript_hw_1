import tornado.ioloop
import tornado.web
import tornado.websocket

from tornado.options import define, options, parse_command_line
from json import loads

define("port", default=8888, help="run on the given port", type=int)

class IndexHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self):
        self.render("static/list.html")


items = []
listeners = set()

def informListeners():
    for listener in listeners:
        listener.ws_connection.write_message("please do something")

        
class ItemsHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self):
        self.write({"data":items})
        self.finish()

    @tornado.web.asynchronous
    def post(self):
        items.append(loads(self.request.body))
        informListeners()
        self.finish()


class ItemsSwapper(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def post(self):
        RequestJSON = loads(self.request.body)
        index1 = RequestJSON["old_position"]
        index2 = RequestJSON["new_position"]
        item = items[index1]
        items.remove(item)
        items.insert(index2,item)
        informListeners()
        self.finish()


class UpdateInformer(tornado.websocket.WebSocketHandler):
    def open(self):
        listeners.add(self)
        print("connection started")


    def on_close(self, message=None):
        listeners.remove(self)
        print("connection closed")


class MyStaticFileHandler(tornado.web.StaticFileHandler):
    def set_extra_headers(self, path):
        self.set_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')

    

app = tornado.web.Application([
    (r'/', IndexHandler),
    (r'/items', ItemsHandler),
    (r'/itemsswapper', ItemsSwapper),
    (r'/updateinformer', UpdateInformer),
    (r"/static/(.*)", MyStaticFileHandler, {"path": "static"})
])

if __name__ == '__main__':
    parse_command_line()
    app.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()
