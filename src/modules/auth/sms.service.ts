import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as tencentcloud from 'tencentcloud-sdk-nodejs-sms';

/**
 * 腾讯云短信服务响应接口
 */
interface SmsResponse {
  SendStatusSet: Array<{
    Code: string;
    Message: string;
  }>;
}

const SmsClient = tencentcloud.sms.v20210111.Client;

/**
 * 短信服务类
 * 用于处理短信验证码的发送和验证
 */
@Injectable()
export class SmsService {
  private client: InstanceType<typeof SmsClient>;
  private readonly appId: string;
  private readonly signName: string;
  private readonly templateId: string;

  constructor(private configService: ConfigService) {
    const secretId = this.configService.get<string>('TENCENT_CLOUD_SECRET_ID');
    const secretKey = this.configService.get<string>(
      'TENCENT_CLOUD_SECRET_KEY',
    );
    this.appId = this.configService.get<string>('TENCENT_SMS_APP_ID') ?? '';
    this.signName =
      this.configService.get<string>('TENCENT_SMS_SIGN_NAME') ?? '';
    this.templateId =
      this.configService.get<string>('TENCENT_SMS_TEMPLATE_ID') ?? '';

    this.client = new SmsClient({
      credential: {
        secretId,
        secretKey,
      },
      region: 'ap-guangzhou',
      profile: {
        signMethod: 'HmacSHA256',
        httpProfile: {
          reqMethod: 'POST', // 请求方法
          endpoint: 'sms.tencentcloudapi.com',
        },
      },
    });
  }

  /**
   * 发送短信验证码
   * @param phoneNumber 手机号码
   * @param code 验证码
   * @returns 发送是否成功
   */
  async sendVerificationCode(
    phoneNumber: string,
    code: string,
  ): Promise<boolean> {
    try {
      const params = {
        SmsSdkAppId: this.appId,
        SignName: this.signName,
        TemplateId: this.templateId,
        TemplateParamSet: [code],
        PhoneNumberSet: [`+86${phoneNumber}`],
      };

      const result = (await this.client.SendSms(params)) as SmsResponse;
      if (result.SendStatusSet[0].Code === 'Ok') {
        return true;
      } else {
        console.error('Failed to send SMS:', result);
        return false;
      }
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }
}
