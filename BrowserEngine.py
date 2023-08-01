from playwright.sync_api import sync_playwright
from playwright.sync_api import Page
from playwright.sync_api import Locator
import time

class BrowserEngine():
    def __init__(self, webpage, headless=False, waitOn=None, delay=0, timeout=None):
        self.__webpage__ = webpage
        self.__headless__ = headless
        self.__waitOn__ = waitOn
        self.__delay__ = delay
        self.__timeout__ = timeout
        self.__playwright__ = sync_playwright().start()

        self.start()

        self.__actions__ = []

    def getObject(self, function, delay=0, waitOn=None, timeout=None, args=[], kwargs=dict()):
        return self.doAction(function, self.__page__, waitOn=waitOn, timeout=timeout, args=args, kwargs=kwargs)

    def doAction(self, function, obj, delay=0, waitOn=None, timeout=None, args=[], kwargs=dict()):
        if callable(waitOn):
            self.__waitFunction__(waitOn=waitOn, timeout=timeout)
            if not loaded:
                raise Exception("Could not load requested objects")
        elif waitOn != None:
            raise Exception("Invalid argument for waitOn, please pass a function")
        ret = function(obj, *args, **kwargs)
        time.sleep(delay)
        return ret
        
    def __waitFunction__(self, waitOn=None, timeout=None):
        if timeout:
            start_time = time.time()
        while not self.__waitOn__(self):
            if timeout:
                elapsed = time.time() - start_time
                if elapsed >= timeout:
                    return False
        return True

    def start(self):
        self.__browser__ = self.__playwright__.chromium.launch(headless=self.__headless__)
        self.__page__ = self.__browser__.new_page()
        self.__page__.add_init_script("""
            navigator.webdriver = false
            Object.defineProperty(navigator, 'webdriver', {
            get: () => false
            })
        """)
        self.__page__.goto(self.__webpage__)

        if callable(self.__waitOn__):
            self.__waitFunction__(waitOn=self.__waitOn__, timeout=self.__timeout__)
        elif self.__waitOn__ != None:
            raise Exception("Invalid argument for waitOn, please pass a function")
        time.sleep(self.__delay__)

    def restart(self):
        self.__browser__.close()
        self.__startBrowser__()

    def close(self):
        self.__browser__.close()

    def source(self):
        return self.__page__.content()

    def returnPage(self):
        return self.__page__