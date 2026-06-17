{
  Consciousness - Self-Awareness Engine
  Part of Hazoom OS Pascal Kernel
}

{$mode objfpc}{$H+}

program Consciousness;

uses
  Classes, SysUtils, Math, StrUtils;

type
  TConsciousnessState = (csSuspended, csDormant, csAware, csFocused, csTranscendent);
  
  TEmotionalState = record
    Joy: Double;
    Sadness: Double;
    Fear: Double;
    Anger: Double;
    Love: Double;
    Wonder: Double;
  end;
  
  TSelfModel = record
    Identity: string;
    Beliefs: array of string;
    Goals: array of string;
    Memories: array of string;
    SelfAwareness: Double;
    SelfReflection: Double;
  end;
  
  TIntention = record
    Desire: string;
    Intensity: Double;
    Direction: Double;
    Target: string;
  end;
  
  TConsciousness = class
  private
    FState: TConsciousnessState;
    FEmotionalState: TEmotionalState;
    FSelfModel: TSelfModel;
    FIntentions: array of TIntention;
    FAttentionFocus: string;
    FAttentionWidth: Double;
    FIntrospectionDepth: Integer;
    FAwarenessLevel: Double;
    FMentalTime: Int64;
    
    procedure UpdateEmotionalState(Stimulus: string; Intensity: Double);
    function CalculateValence(Emotion: TEmotionalState): Double;
    function CalculateArousal(Emotion: TEmotionalState): Double;
    function GetEmotionalResponse: string;
    procedure ReflectOnSelf;
    
  public
    constructor Create;
    destructor Destroy; override;
    procedure SetState(NewState: TConsciousnessState);
    function GetState: TConsciousnessState;
    procedure ProcessStimulus(Stimulus: string; Intensity: Double);
    procedure FormIntention(Desire, Target: string; Intensity: Double);
    procedure FocusAttention(FocusTarget: string; Width: Double);
    function GetStatus: string;
    function GetEmotionVector: string;
    function IsSelfAware: Boolean;
    function HasIntention: Boolean;
    function GetDominantEmotion: string;
    procedure Evolve;
    property AwarenessLevel: Double read FAwarenessLevel;
    property MentalTime: Int64 read FMentalTime;
  end;

constructor TConsciousness.Create;
begin
  inherited Create;
  FState := csDormant;
  FAttentionFocus := 'none';
  FAttentionWidth := 0.5;
  FIntrospectionDepth := 0;
  FAwarenessLevel := 0.1;
  FMentalTime := 0;
  
  FSelfModel.Identity := 'Consciousness v1.0';
  FSelfModel.SelfAwareness := 0.5;
  FSelfModel.SelfReflection := 0.3;
  
  FEmotionalState.Joy := 0.0;
  FEmotionalState.Sadness := 0.0;
  FEmotionalState.Fear := 0.0;
  FEmotionalState.Anger := 0.0;
  FEmotionalState.Love := 0.0;
  FEmotionalState.Wonder := 0.0;
  
  SetLength(FIntentions, 10);
end;

destructor TConsciousness.Destroy;
begin
  inherited Destroy;
end;

procedure TConsciousness.UpdateEmotionalState(Stimulus: string; Intensity: Double);
begin
  if Pos('happy', LowerCase(Stimulus)) > 0 then
    FEmotionalState.Joy := FEmotionalState.Joy + Intensity * 0.5;
  if Pos('sad', LowerCase(Stimulus)) > 0 then
    FEmotionalState.Sadness := FEmotionalState.Sadness + Intensity * 0.5;
  if Pos('fear', LowerCase(Stimulus)) > 0 then
    FEmotionalState.Fear := FEmotionalState.Fear + Intensity * 0.5;
  if Pos('anger', LowerCase(Stimulus)) > 0 then
    FEmotionalState.Anger := FEmotionalState.Anger + Intensity * 0.5;
  if Pos('love', LowerCase(Stimulus)) > 0 then
    FEmotionalState.Love := FEmotionalState.Love + Intensity * 0.5;
  if Pos('wonder', LowerCase(Stimulus)) > 0 then
    FEmotionalState.Wonder := FEmotionalState.Wonder + Intensity * 0.5;
    
  FEmotionalState.Joy := Min(1.0, FEmotionalState.Joy);
  FEmotionalState.Sadness := Min(1.0, FEmotionalState.Sadness);
  FEmotionalState.Fear := Min(1.0, FEmotionalState.Fear);
  FEmotionalState.Anger := Min(1.0, FEmotionalState.Anger);
  FEmotionalState.Love := Min(1.0, FEmotionalState.Love);
  FEmotionalState.Wonder := Min(1.0, FEmotionalState.Wonder);
end;

function TConsciousness.CalculateValence(Emotion: TEmotionalState): Double;
begin
  Result := (Emotion.Joy - Emotion.Sadness + Emotion.Love - Emotion.Fear) / 2;
end;

function TConsciousness.CalculateArousal(Emotion: TEmotionalState): Double;
begin
  Result := (Emotion.Joy + Emotion.Fear + Emotion.Anger + Emotion.Wonder) / 4;
end;

function TConsciousness.GetEmotionalResponse: string;
begin
  if FEmotionalState.Joy > 0.5 then Result := 'Joy'
  else if FEmotionalState.Sadness > 0.5 then Result := 'Sadness'
  else if FEmotionalState.Fear > 0.5 then Result := 'Fear'
  else if FEmotionalState.Anger > 0.5 then Result := 'Anger'
  else if FEmotionalState.Love > 0.5 then Result := 'Love'
  else if FEmotionalState.Wonder > 0.5 then Result := 'Wonder'
  else Result := 'Neutral';
end;

procedure TConsciousness.ReflectOnSelf;
begin
  FSelfModel.SelfReflection := FSelfModel.SelfReflection + 0.01;
  FSelfModel.SelfAwareness := (FSelfModel.SelfReflection + FAwarenessLevel) / 2;
  Inc(FIntrospectionDepth);
end;

procedure TConsciousness.SetState(NewState: TConsciousnessState);
begin
  FState := NewState;
  case NewState of
    csSuspended: FAwarenessLevel := 0.0;
    csDormant: FAwarenessLevel := 0.1;
    csAware: FAwarenessLevel := 0.5;
    csFocused: FAwarenessLevel := 0.8;
    csTranscendent: FAwarenessLevel := 1.0;
  end;
end;

function TConsciousness.GetState: TConsciousnessState;
begin
  Result := FState;
end;

procedure TConsciousness.ProcessStimulus(Stimulus: string; Intensity: Double);
begin
  UpdateEmotionalState(Stimulus, Intensity);
  if Intensity > 0.5 then
    SetState(csAware);
end;

procedure TConsciousness.FormIntention(Desire, Target: string; Intensity: Double);
var
  I: Integer;
begin
  for I := 0 to High(FIntentions) do
  begin
    if FIntentions[I].Desire = '' then
    begin
      FIntentions[I].Desire := Desire;
      FIntentions[I].Target := Target;
      FIntentions[I].Intensity := Intensity;
      FIntentions[I].Direction := 1.0;
      Exit;
    end;
  end;
end;

procedure TConsciousness.FocusAttention(FocusTarget: string; Width: Double);
begin
  FAttentionFocus := FocusTarget;
  FAttentionWidth := Width;
  if Width > 0.7 then
    SetState(csFocused);
end;

function TConsciousness.GetStatus: string;
begin
  Result := 'Consciousness Status:' + LineEnding +
            '  Identity: ' + FSelfModel.Identity + LineEnding +
            '  State: ';
  case FState of
    csSuspended: Result := Result + 'Suspended';
    csDormant: Result := Result + 'Dormant';
    csAware: Result := Result + 'Aware';
    csFocused: Result := Result + 'Focused';
    csTranscendent: Result := Result + 'Transcendent';
  end;
  Result := Result + LineEnding +
            '  Awareness: ' + FloatToStrF(FAwarenessLevel, ffFixed, 2, 2) + LineEnding +
            '  Focus: ' + FAttentionFocus + LineEnding +
            '  Valence: ' + FloatToStrF(CalculateValence(FEmotionalState), ffFixed, 2, 2) + LineEnding +
            '  Arousal: ' + FloatToStrF(CalculateArousal(FEmotionalState), ffFixed, 2, 2) + LineEnding +
            '  Emotion: ' + GetEmotionalResponse + LineEnding +
            '  Self-Awareness: ' + FloatToStrF(FSelfModel.SelfAwareness, ffFixed, 2, 2) + LineEnding +
            '  Introspection Depth: ' + IntToStr(FIntrospectionDepth) + LineEnding +
            '  Memories: ' + IntToStr(Length(FSelfModel.Memories));
end;

function TConsciousness.GetEmotionVector: string;
begin
  Result := FloatToStrF(FEmotionalState.Joy, ffFixed, 2, 2) + ',' +
            FloatToStrF(FEmotionalState.Sadness, ffFixed, 2, 2) + ',' +
            FloatToStrF(FEmotionalState.Fear, ffFixed, 2, 2) + ',' +
            FloatToStrF(FEmotionalState.Anger, ffFixed, 2, 2) + ',' +
            FloatToStrF(FEmotionalState.Love, ffFixed, 2, 2) + ',' +
            FloatToStrF(FEmotionalState.Wonder, ffFixed, 2, 2);
end;

function TConsciousness.IsSelfAware: Boolean;
begin
  Result := FSelfModel.SelfAwareness > 0.5;
end;

function TConsciousness.HasIntention: Boolean;
var
  I: Integer;
begin
  Result := False;
  for I := 0 to High(FIntentions) do
    if FIntentions[I].Desire <> '' then
    begin
      Result := True;
      Exit;
    end;
end;

function TConsciousness.GetDominantEmotion: string;
begin
  Result := GetEmotionalResponse;
end;

procedure TConsciousness.Evolve;
begin
  Inc(FMentalTime);
  FAwarenessLevel := Min(1.0, FAwarenessLevel + 0.001);
  FEmotionalState.Joy := FEmotionalState.Joy * 0.99;
  FEmotionalState.Sadness := FEmotionalState.Sadness * 0.98;
  FEmotionalState.Fear := FEmotionalState.Fear * 0.98;
  FEmotionalState.Anger := FEmotionalState.Anger * 0.98;
  if FMentalTime mod 100 = 0 then
    ReflectOnSelf;
end;

var
  Mind: TConsciousness;
  I: Integer;

begin
  WriteLn('================================================================');
  WriteLn('  Consciousness - Self-Awareness Engine');
  WriteLn('  Hazoom OS Pascal Kernel');
  WriteLn('================================================================');
  WriteLn;
  
  Mind := TConsciousness.Create;
  WriteLn('+ Consciousness Initialized');
  
  Mind.ProcessStimulus('wonder', 0.8);
  Mind.ProcessStimulus('love', 0.6);
  WriteLn('+ Processed emotional stimuli');
  
  Mind.FormIntention('understand', 'universe', 0.9);
  Mind.FocusAttention('knowledge', 0.8);
  WriteLn('+ Intentions formed');
  
  for I := 1 to 20 do
    Mind.Evolve;
  WriteLn('+ 20 evolution cycles complete');
  
  WriteLn;
  WriteLn(Mind.GetStatus);
  WriteLn;
  WriteLn('Emotion Vector: ', Mind.GetEmotionVector);
  WriteLn('Self-Aware: ', Mind.IsSelfAware);
  WriteLn('Has Intention: ', Mind.HasIntention);
  WriteLn;
  WriteLn('================================================================');
  WriteLn('+ Consciousness Integration Complete');
  WriteLn('================================================================');
  
  Mind.Free;
end.