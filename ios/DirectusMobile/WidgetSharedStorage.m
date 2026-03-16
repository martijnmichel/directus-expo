#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetSharedStorage, NSObject)

RCT_EXTERN_METHOD(setConfigList:(NSString *)json
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setPayload:(NSString *)id
                  json:(NSString *)json
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
