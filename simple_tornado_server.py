import tornado.ioloop
import tornado.web
import tornado.websocket

from tornado.options import define, options, parse_command_line

from json import loads, dumps

define("port", default=8888, help="run on the given port", type=int)



class IndexHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self):
        self.render("static/list.html")


items = []
listeners = set()   
class ItemsHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self):
        self.write({"data":items})
        self.finish()



def informAllListenersExcept(message, exception):
    for listener in listeners:
        if listener != exception:
            listener.ws_connection.write_message(message)

def informAboutUpdate(exception):
    data = {"method":"update", "elements":items}
    informAllListenersExcept(dumps(data), exception)


ActionsMap = {}
def swap(data):
    index1 = data["old_position"]
    index2 = data["new_position"]
    item = items[index1]
    items.remove(item)
    items.insert(index2,item)

ActionsMap["add"] = lambda data: items.append(data["item"])
ActionsMap["swap"] = swap

                                           
class UpdateInformer(tornado.websocket.WebSocketHandler):
    def open(self):
        listeners.add(self)
        data = {"method":"update", "elements":items}
        self.ws_connection.write_message(dumps(data))
        print("connection started")

    def on_message(self, message):
        data = loads(message)
        action = ActionsMap[data["method"]]
        action(data)
        informAboutUpdate(exception=self)
    
    def on_close(self, message=None):
        listeners.remove(self)
        print("connection closed")


class MyStaticFileHandler(tornado.web.StaticFileHandler):
    def set_extra_headers(self, path):
        self.set_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')

    

app = tornado.web.Application([
    (r'/', IndexHandler),
    (r'/items', ItemsHandler),
    (r'/updateinformer', UpdateInformer),
    (r"/static/(.*)", MyStaticFileHandler, {"path": "static"})
])

if __name__ == '__main__':
    parse_command_line()
    app.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()
